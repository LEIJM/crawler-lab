/**
 * Cloudflare Workers 入口：课程接口 + 静态资源（SPA）。
 * 静态文件由 wrangler.jsonc 的 assets 提供；未命中资源时回退到 index.html。
 */
import { handleApiRequest } from '../server/api.js'

export default {
  async fetch(request, env) {
    const api = await handleApiRequest(request)
    if (api) return api
    if (env.ASSETS) return env.ASSETS.fetch(request)
    return new Response('Not found', { status: 404 })
  }
}
