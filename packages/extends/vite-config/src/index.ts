import type { UserConfig } from 'vite'
import { mergeConfig } from 'vite'
import { execSync } from 'child_process'
import electron from 'electron'
import { builtinModules } from 'module'

export interface ExtendOptions {
  root?: string
  libMode?: boolean
  isMain?: boolean
  packageName?: string
}
const { node, chrome } = getNodeAndChromeVersion()

const APP_MODE = process.env.APP_MODE

export function extendBasicViteConfig(
  extendConfig: UserConfig,
  { libMode = false, isMain = false }: ExtendOptions = {},
) {
  let commonConfig: UserConfig = {
    base: '',
    server: {
      fs: {
        strict: true,
      },
    },
    define: {
      __DEV__: APP_MODE === 'development',
    },
    build: {
      target: isMain ? `node${node}` : `chrome${chrome}`,
      minify: APP_MODE !== 'development',
      cssCodeSplit: false,
      outDir: 'dist',
      assetsDir: '.',
      rollupOptions: {
        external: builtinModules,
      },
      emptyOutDir: true,
    },
  }

  if (libMode) {
    commonConfig = mergeConfig(commonConfig, {
      build: {
        lib: {
          entry: 'src/index.ts',
          formats: ['cjs'],
        },
        rollupOptions: {
          external: ['electron'],
          output: {
            entryFileNames: '[name].cjs',
          },
        },
      },
    })
  }

  return mergeConfig(commonConfig, extendConfig)
}

function getNodeAndChromeVersion() {
  const output = execSync(`${electron} -p "JSON.stringify(process.versions)"`, {
    env: { ELECTRON_RUN_AS_NODE: '1' },
    encoding: 'utf-8',
  })
  const electronRelease = JSON.parse(output)
  const nodeMajorVersion = electronRelease.node.split('.')[0]
  const chromeMajorVersion =
    electronRelease.v8.split('.')[0] + electronRelease.v8.split('.')[1]

  return {
    chrome: chromeMajorVersion,
    node: nodeMajorVersion,
  }
}
