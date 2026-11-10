/**
 * Cloudflare Pages Functions：与 Workers 共用 server/api.js。
 * 非接口请求交给静态资源 / SPA 回退（public/_redirects）。
 */
import { handleApiRequest } from '../server/api.js'

export async function onRequest(context) {
  const api = await handleApiRequest(context.request)
  if (api) return api
  return context.next()
}
