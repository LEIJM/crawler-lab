import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { handleApi } from './server/server.js'

/**
 * 开发模式内置接口插件
 * ---------------------------------------------------------------
 * 把 server/server.js 的接口层（/kaptcha.jpg、/login、/api/*）直接挂载到
 * Vite 开发服务器的中间件里。这样 `npm run dev` 一条命令即可完整使用
 * 验证码、登录与闯关接口，无需另开终端启动后端，也彻底避免代理
 * ECONNREFUSED 问题。生产模式由 Node 服务器或 Cloudflare Workers/Pages 提供同样接口。
 */
function devApiMiddleware() {
  return {
    name: 'data221-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleApi(req, res)
          if (!handled) next()
        } catch (e) {
          next(e)
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), devApiMiddleware()],
  base: '/',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200
  },
  server: {
    port: 5173,
    host: true
  }
})