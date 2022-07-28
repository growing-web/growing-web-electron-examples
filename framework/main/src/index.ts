import { app, BrowserWindow, BrowserView } from 'electron'
import { join } from 'path'
import { apps } from './apps'
import { ipcMain } from 'electron-better-ipc'

let win: BrowserWindow | null = null

let viewList: { view: BrowserView; url: string }[] = []

const MAIN_WINDOW_PRELOAD_URL = join(__dirname, '../../preload/dist/index.cjs')

const HTML_URL =
  __DEV__ && __DEV_SERVER_URL__
    ? __DEV_SERVER_URL__
    : new URL(
        `../../framework/renderer/dist/index.html`,
        'file://' + __dirname,
      ).toString()

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    // 宽度
    width: 1200,
    // 高度
    height: 620,
    // 延缓首屏打开慢视觉效果
    backgroundColor: '#ECECEC',
    //  屏幕居中
    center: true,
    // 最小宽度
    minWidth: 1120,
    // 最小高度
    minHeight: 560,
    webPreferences: {
      enableBlinkFeatures: '',
      webviewTag: false,
      nodeIntegration: true,
      // 界面不是前景的时候是否限制动画和计时器
      backgroundThrottling: false,
      preload: MAIN_WINDOW_PRELOAD_URL,
    },
  })

  win.loadURL(HTML_URL)

  await initApps(win)

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })
}

async function createBrowserView(url: string, window: BrowserWindow) {
  const view = new BrowserView()
  window.addBrowserView(view)
  const [width, height] = window.getSize()
  view.setBounds({ x: 0, y: 32, width: width, height: height })
  view.setAutoResize({ width: true, height: true })

  //   const HTML_URL =
  //     __DEV__ && __DEV_SERVER_URL__
  //       ? __DEV_SERVER_URL__
  //       : new URL(
  //           `../../apps/renderer/dist/index.html`,
  //           'file://' + __dirname,
  //         ).toString()

  view.webContents.loadURL(
    new URL(`../../apps/${url}.html`, 'file://' + __dirname).toString(),
  )
  return view
}

async function initApps(window: BrowserWindow) {
  for (const app of apps) {
    viewList.push({
      url: app.url,
      view: await createBrowserView(app.url, window),
    })
  }
}

async function changeBrowserView(view: BrowserView, win: BrowserWindow) {
  win.removeBrowserView(view)
  win.setBrowserView(view)
}

app.whenReady().then(createWindow)

ipcMain.answerRenderer('path-change', (_path) => {
  if (_path) {
    const ret = viewList.find((item) => item.url === `${_path}/entry`)
    if (ret?.view && win) {
      changeBrowserView(ret?.view, win)
    }
  }
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

if (__DEV__) {
  // 在开发模式下，应父进程的要求完全退出。
  process.on('SIGTERM', () => {
    app.quit()
  })
}
