/**
 * 课程接口（Fetch API）
 * ---------------------------------------------------------------
 * 供三处复用：
 *   1. Node 生产服务器（server/server.js 适配为 IncomingMessage）
 *   2. Vite 开发中间件
 *   3. Cloudflare Workers / Pages Functions
 *
 * 返回 Response 表示已处理；返回 null 表示非接口路径。
 */
import { drawCaptchaPNG, randomCode } from './captcha.js'
import { issueCaptchaToken, readCaptchaToken, randomHex, SESSION_TTL } from './token.js'

const USERS = {
  student: { password: '123456', nickname: '同学（student）' },
  teacher: { password: '888888', nickname: '老师（teacher）' }
}

const CHALLENGE_ANSWERS = {
  1: 'CT-7749',
  2: 'CT-2026-NEWS',
  3: 'CT-FAQ-3355',
  4: 'CT-SALE-9198',
  5: 'CT-BASE-6420',
  6: 'CT-HEADER-2026'
}

export { USERS, CHALLENGE_ANSWERS }

export function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of String(header).split(';')) {
    const idx = part.indexOf('=')
    if (idx < 0) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    if (k) out[k] = v
  }
  return out
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

function json(status, obj, extraHeaders = {}) {
  const { 'Set-Cookie': setCookie, ...rest } = extraHeaders
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    ...rest
  })
  if (setCookie) {
    for (const c of Array.isArray(setCookie) ? setCookie : [setCookie]) {
      headers.append('Set-Cookie', c)
    }
  }
  return new Response(JSON.stringify(obj), { status, headers })
}

function png(body, extraHeaders = {}) {
  const { 'Set-Cookie': setCookie, ...rest } = extraHeaders
  const headers = new Headers({
    'Content-Type': 'image/png',
    'Cache-Control': 'no-store, max-age=0',
    'Access-Control-Allow-Origin': '*',
    ...rest
  })
  if (setCookie) headers.append('Set-Cookie', setCookie)
  return new Response(body, { status: 200, headers })
}

const BODY_LIMIT = 16 * 1024 // 与 Node 适配层 64KB 限制对齐并更收紧：教学接口载荷远小于此

async function parseBody(request) {
  // 统一三端（Node / Workers / Pages）的请求体大小限制
  const declared = Number(request.headers.get('content-length') || 0)
  if (declared > BODY_LIMIT) {
    throw new Error(`请求体过大（>${BODY_LIMIT} 字节）`)
  }
  const raw = await request.text()
  if (raw.length > BODY_LIMIT) {
    throw new Error(`请求体过大（>${BODY_LIMIT} 字节）`)
  }
  const type = String(request.headers.get('content-type') || '')
  if (type.includes('application/json')) {
    try { return JSON.parse(raw || '{}') } catch { return {} }
  }
  const out = {}
  for (const pair of raw.split('&')) {
    if (!pair) continue
    const idx = pair.indexOf('=')
    if (idx < 0) {
      out[decodeURIComponent(pair)] = ''
    } else {
      out[decodeURIComponent(pair.slice(0, idx).replace(/\+/g, ' '))] =
        decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '))
    }
  }
  return out
}

function bytesToBase64(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

async function handleLogin(request) {
  const body = await parseBody(request)
  const username = String(body.username || '').trim()
  const password = String(body.password || '')
  const verifyCode = String(body.verifyCode || '').trim()

  const cookies = parseCookies(request.headers.get('cookie'))
  const sess = await readCaptchaToken(cookies.RYSESSID)
  if (!sess) {
    return json(200, { code: 500, msg: '验证码已失效，请刷新验证码后重试' })
  }
  if (verifyCode.toUpperCase() !== sess.code.toUpperCase()) {
    return json(200, { code: 500, msg: '验证码错误' })
  }
  const user = USERS[username]
  if (!user || user.password !== password) {
    return json(200, { code: 500, msg: '用户名或密码错误' })
  }
  const token = randomHex(16)
  return json(200, {
    code: 200,
    msg: '登录成功',
    data: { username, nickname: user.nickname, token }
  }, {
    'Set-Cookie': [
      cookie('RYSESSID', '', 0),
      cookie('ryName', encodeURIComponent(username), 604800),
      cookie('ryToken', token, 604800)
    ]
  })
}

async function handleBaiduLogin(request) {
  const body = await parseBody(request)
  const username = String(body.username || '').trim()
  const password = String(body.password || '')
  const agree = body.agree === true || body.agree === 'true' || body.agree === 'on'
  if (!agree) return json(200, { code: 500, msg: '请阅读并同意《用户服务协议》' })
  const user = USERS[username]
  if (!user || user.password !== password) {
    return json(200, { code: 500, msg: '用户名或密码错误' })
  }
  const bduss = bytesToBase64(new TextEncoder().encode(`${username}:simulated`))
  const baiduid = randomHex(16).toUpperCase()
  return json(200, {
    code: 200,
    msg: '登录成功',
    data: { username, nickname: user.nickname, bduss }
  }, {
    'Set-Cookie': [
      cookie('BAIDUID', baiduid, 604800),
      cookie('BDUSS', encodeURIComponent(bduss), 604800)
    ]
  })
}

async function handleCaptchaNew() {
  const code = randomCode()
  const cid = await issueCaptchaToken(code)
  return json(200, {
    code: 200,
    msg: 'ok',
    data: { cid, url: `/kaptcha.jpg?cid=${encodeURIComponent(cid)}&t=${Date.now()}` }
  })
}

async function handleCaptchaVerify(request) {
  const body = await parseBody(request)
  const cid = String(body.cid || '')
  const code = String(body.code || '').trim()
  const entry = await readCaptchaToken(cid)
  const pass = !!entry && code.toUpperCase() === entry.code.toUpperCase()
  return json(200, { code: 200, msg: 'ok', data: { pass } })
}

async function handleChallengeCheck(request) {
  const body = await parseBody(request)
  const level = Number(body.level)
  const answer = String(body.answer || '').trim().toUpperCase()
  const expect = CHALLENGE_ANSWERS[level]
  return json(200, { code: 200, msg: 'ok', data: { pass: !!expect && answer === expect } })
}

function handleChallengeSecret(request) {
  const sid = String(request.headers.get('x-student-id') || '').trim()
  if (!sid) {
    return json(200, {
      code: 403,
      msg: '请求被拒绝：缺少身份请求头 X-Student-Id（反爬策略示例）',
      data: { hint: '请用 requests 或 fetch 携带 headers={"X-Student-Id":"data221"} 重试' }
    })
  }
  return json(200, {
    code: 200,
    msg: 'ok',
    data: { secret: 'CT-HEADER-2026', headersEcho: { 'x-student-id': sid } }
  })
}

async function issueSessionCaptcha() {
  const code = randomCode()
  const token = await issueCaptchaToken(code)
  return png(drawCaptchaPNG(code), {
    'Set-Cookie': cookie('RYSESSID', token, Math.floor(SESSION_TTL / 1000))
  })
}

async function issueCidCaptcha(cid) {
  const entry = await readCaptchaToken(cid)
  const code = entry ? entry.code : randomCode()
  return png(drawCaptchaPNG(code))
}

/**
 * @param {Request} request
 * @returns {Promise<Response|null>}
 */
export async function handleApiRequest(request) {
  let u
  try {
    u = new URL(request.url)
  } catch {
    return null
  }
  const pathname = decodeURIComponent(u.pathname)
  const method = request.method.toUpperCase()

  const isApiPath =
    pathname === '/kaptcha.jpg' ||
    pathname.startsWith('/api/') ||
    (method === 'POST' && pathname === '/login')
  if (!isApiPath) return null

  try {
    if (method === 'GET') {
      if (pathname === '/kaptcha.jpg') {
        const cid = u.searchParams.get('cid')
        return cid ? await issueCidCaptcha(cid) : await issueSessionCaptcha()
      }
      if (pathname === '/api/health') {
        return json(200, { ok: true, ts: Date.now(), service: 'data221-crawler-lab' })
      }
      if (pathname === '/api/challenge/secret') {
        return handleChallengeSecret(request)
      }
    }
    if (method === 'POST') {
      if (pathname === '/login') return await handleLogin(request)
      if (pathname === '/api/baidu/login') return await handleBaiduLogin(request)
      if (pathname === '/api/captcha/new') return await handleCaptchaNew()
      if (pathname === '/api/captcha/verify') return await handleCaptchaVerify(request)
      if (pathname === '/api/challenge/check') return await handleChallengeCheck(request)
    }
    return json(404, { code: 404, msg: '接口不存在或方法不支持' })
  } catch (e) {
    return json(500, { code: 500, msg: '服务器内部错误：' + e.message })
  }
}
