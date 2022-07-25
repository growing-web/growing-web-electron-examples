import { build } from 'vite'
import { resolveRoot } from './utils'

const packagesConfigs = [
  'framework/main/vite.config.ts',
  'framework/preload/vite.config.ts',
  'framework/renderer/vite.config.ts',
]

/**
 * 为配置文件运行`vite build`
 */
const buildByConfig = (configFile: string) =>
  build({ configFile: resolveRoot(configFile), mode: process.env.APP_MODE })

;(async () => {
  try {
    const totalTimeLabel = 'Total bundling time'
    console.time(totalTimeLabel)
    await Promise.all(
      packagesConfigs.map(async (packageConfigPath) => {
        await buildByConfig(packageConfigPath)
        console.log('\n')
      }),
    )
    console.timeEnd(totalTimeLabel)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()
