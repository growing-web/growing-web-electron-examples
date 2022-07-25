import './global.css'
import { createApp } from 'vue'
import App from './app.vue'

const app = createApp(App)

;(async () => {
  // @ts-ignore typo
  app.mount('#app').$nextTick(window.removeLoading)
})()
