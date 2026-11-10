/**
 * Node IncomingMessage / ServerResponse ↔ Fetch Request / Response
 */
import { handleApiRequest } from './api.js'

export function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export async function toFetchRequest(req) {
  const host = req.headers.host || 'localhost'
  const url = new URL(req.url, `http://${host}`)
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue
    headers.set(k, Array.isArray(v) ? v.join(', ') : String(v))
  }
  const method = req.method || 'GET'
  const init = { method, headers }
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await readBody(req)
    init.duplex = 'half'
  }
  return new Request(url, init)
}

export async function writeFetchResponse(res, response) {
  const headers = {}
  const cookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : []
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') return
    headers[key] = value
  })
  if (cookies.length === 1) headers['Set-Cookie'] = cookies[0]
  else if (cookies.length > 1) headers['Set-Cookie'] = cookies
  const buf = Buffer.from(await response.arrayBuffer())
  res.writeHead(response.status, headers)
  res.end(buf)
}

/**
 * 处理课程接口。true = 已写出响应；false = 非接口路径。
 */
export async function handleApi(req, res) {
  const request = await toFetchRequest(req)
  const response = await handleApiRequest(request)
  if (!response) return false
  await writeFetchResponse(res, response)
  return true
}
