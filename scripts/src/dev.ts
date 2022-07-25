import type { LogLevel, InlineConfig, ViteDevServer } from 'vite'
import type { OutputPlugin } from 'rollup'
import type { ChildProcessWithoutNullStreams } from 'child_process'
import { createServer, build, createLogger, mergeConfig } from 'vite'
import electron from 'electron'
import { spawn } from 'child_process'
import path from 'node:path'
import { resolveRoot } from './utils'

const LOG_LEVEL: LogLevel = 'info'

/** Messages on stderr that match any of the contained patterns will be stripped from output */
const stderrFilterPatterns = [
  /**
   * warning about devtools extension
   * @see https://github.com/cawa-93/vite-electron-builder/issues/492
   * @see https://github.com/MarshallOfSound/electron-devtools-installer/issues/143
   */
  /ExtensionLoadWarning/,
]

const sharedConfig: InlineConfig = {
  mode: process.env.APP_MODE,
  build: {
    watch: {},
  },
  define: {
    __DEV_SERVER_URL__: undefined,
    __DEV__: process.env.APP_MODE === 'development',
  },
  logLevel: LOG_LEVEL,
}

const getWatcher = ({
  name,
  configFile,
  writeBundle,
  extendsConfig = {},
}: {
  name: string
  configFile: string
  writeBundle: OutputPlugin['writeBundle']
  extendsConfig?: InlineConfig
}) => {
  return build(
    mergeConfig(
      {
        ...sharedConfig,
        configFile,
        plugins: [{ name, writeBundle }],
      },
      extendsConfig,
    ),
  )
}

/**
 * Start or restart App when source files are changed
 */
const setupMainPackageWatcher = (viteDevServer: ViteDevServer) => {
  // Write a value to an environment variable to pass it to the main process.
  const protocol = `http${viteDevServer.config.server.https ? 's' : ''}:`
  const host = viteDevServer.config.server.host || 'localhost'
  const port = viteDevServer.config.server.port // Vite searches for and occupies the first free port: 3000, 3001, 3002 and so on
  const pathname = '/'
  const VITE_DEV_SERVER_URL = `${protocol}//${host}:${port}${pathname}`

  const logger = createLogger(LOG_LEVEL, {
    prefix: '[main]',
  })

  /** @type {ChildProcessWithoutNullStreams | null} */
  let spawnProcess: ChildProcessWithoutNullStreams | null = null

  return getWatcher({
    name: 'electron-main-watcher',
    configFile: resolveRoot('framework/main/vite.config.ts'),
    writeBundle() {
      /** Kill electron ff process already exist */
      if (spawnProcess !== null) {
        spawnProcess.off('exit', process.exit)
        spawnProcess.kill('SIGINT')
        spawnProcess = null
      }

      /** Spawn new electron process */
      spawnProcess = spawn(String(electron), ['../'])

      /** Proxy all logs */
      spawnProcess.stdout.on(
        'data',
        (d) =>
          d.toString().trim() && logger.warn(d.toString(), { timestamp: true }),
      )

      /** Proxy error logs but stripe some noisy messages. See {@link stderrFilterPatterns} */
      spawnProcess.stderr.on('data', (d) => {
        const data = d.toString().trim()
        if (!data) return
        const mayIgnore = stderrFilterPatterns.some((r) => r.test(data))
        if (mayIgnore) return
        logger.error(data, { timestamp: true })
      })

      /** Stops the watch script when the application has been quit */
      spawnProcess.on('exit', process.exit)
    },
    extendsConfig: {
      define: {
        __DEV_SERVER_URL__: JSON.stringify(VITE_DEV_SERVER_URL),
      },
    },
  })
}

/**
 * Start or restart App when source files are changed
 */
const setupPreloadPackageWatcher = (viteDevServer: ViteDevServer) => {
  return getWatcher({
    name: 'electron-preload-watcher',
    configFile: resolveRoot('framework/preload/vite.config.ts'),
    writeBundle() {
      viteDevServer.ws.send({
        type: 'full-reload',
      })
    },
  })
}

;(async () => {
  try {
    const viteDevServer = await createServer({
      ...sharedConfig,
      configFile: resolveRoot('framework/renderer/vite.config.ts'),
    })

    await viteDevServer.listen()
    await setupPreloadPackageWatcher(viteDevServer)
    await setupMainPackageWatcher(viteDevServer)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()
