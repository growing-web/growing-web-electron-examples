import { extendBasicViteConfig } from 'vite-config'
import vue from '@vitejs/plugin-vue'

export default extendBasicViteConfig(
  {
    root: __dirname,
    plugins: [vue()],
    build: {
      sourcemap: 'inline',
    },
  },
  { libMode: false },
)
