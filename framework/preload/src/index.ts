// 向渲染进程注入需要的变量

import { contextBridge } from 'electron'
import { useLoading } from './loading'
import { domReady } from './utils'
import { ipcRenderer } from 'electron-better-ipc'

const { removeLoading, appendLoading } = useLoading()

domReady().then(() => {
  appendLoading()
})

/**
 * Remove loading status.
 * @example
 * console.log(window.removeLoading() )
 */
contextBridge.exposeInMainWorld('removeLoading', removeLoading)

// ipc通信实例
contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer)
