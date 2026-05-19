import { defineConfig } from 'vite'
import uniModule from '@dcloudio/vite-plugin-uni'

// @dcloudio/vite-plugin-uni may resolve through either ESM or CJS interop.
const uni = typeof uniModule === 'function' ? uniModule : uniModule.default

export default defineConfig({
  plugins: [uni()]
})
