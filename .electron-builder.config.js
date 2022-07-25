if (process.env.VITE_APP_VERSION === undefined) {
  const now = new Date()
  process.env.VITE_APP_VERSION = `${now.getUTCFullYear() - 2000}.${
    now.getUTCMonth() + 1
  }.${now.getUTCDate()}-${now.getUTCHours() * 60 + now.getUTCMinutes()}`
}

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  appId: 'growing-web.app',
  asar: false,
  publish: {
    provider: 'generic',
    url: '',
    channel: 'latest',
  },
  electronDownload: {
    mirror: 'https://npmmirror.com/mirrors/electron/',
  },
  directories: {
    output: 'dist',
    buildResources: 'buildResources',
  },
  files: ['packages/**/dist/**', '!node_modules'],
  extraMetadata: {
    version: process.env.VITE_APP_VERSION,
  },
}

module.exports = config
