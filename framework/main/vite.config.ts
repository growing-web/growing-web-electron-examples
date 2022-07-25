import { extendBasicViteConfig } from 'vite-config'

export default extendBasicViteConfig(
  {
    root: __dirname,
  },
  { libMode: true, isMain: true },
)
