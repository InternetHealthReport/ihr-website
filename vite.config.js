import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { existsSync } from 'fs'
import VueDevTools from 'vite-plugin-vue-devtools'

const dotPathFixPlugin = () => ({
  name: "dot-path-fix-plugin",
  configureServer: (server) => {
    server.middlewares.use((req, _, next) => {
      const reqPath = req.url.split("?", 2)[0]
      if (
        !req.url.startsWith("/@") && // virtual files provided by vite plugins
        !req.url.startsWith("/api/") && // api proxy, configured below
        !existsSync(`./public${reqPath}`) && // files served directly from public folder
        !existsSync(`.${reqPath}`) // actual files
      ) {
        req.url = "/"
      }
      next()
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar(),
    VueI18nPlugin({
      strictMessage: false,
    }),
    dotPathFixPlugin(),
    VueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: ['es2022']
  }
})
