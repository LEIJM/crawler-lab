/**
 * 无状态验证码令牌（AES-GCM）
 * ---------------------------------------------------------------
 * Cloudflare Workers / Pages 没有跨请求共享的进程内存，因此验证码
 * 不再放进 Map，而是封进 RYSESSID Cookie 或 cid 查询参数。
 * Node 生产服务器与边缘运行时共用同一套逻辑，教学接口契约不变。
 */
const DEFAULT_SECRET = 'data221-crawler-lab-captcha-key'
export const SESSION_TTL = 10 * 60 * 1000

function secretString() {
  try {
    if (typeof process !== 'undefined' && process.env?.CAPTCHA_SECRET) {
      return process.env.CAPTCHA_SECRET
    }
  } catch { /* Workers 无 process 时忽略 */ }
  return DEFAULT_SECRET
}

function toBase64Url(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  const b64 = btoa(bin)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(s) {
  const b64 = String(s).replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const bin = atob(b64 + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function importKey(secret) {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function seal(payload, secret = secretString()) {
  const key = await importKey(secret)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(JSON.stringify(payload))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data))
  const out = new Uint8Array(iv.length + ct.length)
  out.set(iv, 0)
  out.set(ct, iv.length)
  return toBase64Url(out)
}

export async function unseal(token, secret = secretString()) {
  if (!token) return null
  try {
    const buf = fromBase64Url(token)
    if (buf.length < 13) return null
    const iv = buf.subarray(0, 12)
    const ct = buf.subarray(12)
    const key = await importKey(secret)
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
    const obj = JSON.parse(new TextDecoder().decode(pt))
    if (obj.exp && obj.exp < Date.now()) return null
    return obj
  } catch {
    return null
  }
}

export async function issueCaptchaToken(code, ttl = SESSION_TTL) {
  return seal({ code, exp: Date.now() + ttl })
}

export async function readCaptchaToken(token) {
  const obj = await unseal(token)
  if (!obj || typeof obj.code !== 'string') return null
  return obj
}

export function randomHex(bytes = 16) {
  const b = new Uint8Array(bytes)
  crypto.getRandomValues(b)
  let s = ''
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0')
  return s
}
