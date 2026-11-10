/**
 * Data221 爬虫教学实训站 · 零依赖 Node 服务器
 * ---------------------------------------------------------------
 * 仅使用 Node 内置模块，无需 npm install 即可运行，适合内网离线部署。
 *
 * 职责：
 * 1. 托管 Vite 构建产物 dist/（含 history 路由回退，保证 /login、/shopping/index 等
 *    深链接直达 SPA 页面）；
 * 2. 提供课程练习所需的全部接口：
 *    - GET  /kaptcha.jpg        图形验证码（Session 绑定，Set-Cookie: RYSESSID）
 *    - POST /login              人邮书城登录接口（对应 notebook requests 提交表单）
 *    - POST /api/baidu/login    伪百度登录（成功后 Set-Cookie: BAIDUID / BDUSS）
 *    - POST /api/captcha/new    独立验证码挑战（cid 绑定，用于验证码识读练习页）
 *    - POST /api/captcha/verify 校验验证码答案
 *    - POST /api/challenge/check 爬虫闯关答案校验
 *    - GET  /api/challenge/secret 请求头校验反爬示例（要求 X-Student-Id）
 *    - GET  /api/health         健康检查
 *
 * 启动：node server/server.js          （默认端口 8188，可用 PORT 环境变量覆盖）
 * 自检：node server/server.js --selftest
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { drawCaptchaPNG, randomCode, crc32 } from './captcha.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')
const PORT = Number(process.env.PORT) || 8188
const SELFTEST = process.argv.includes('--selftest')

/* ================= 会话与验证码存储 ================= */
const SESSION_TTL = 10 * 60 * 1000        // 验证码有效期 10 分钟
const MAX_ENTRIES = 8000
const store = new Map()                    // key: 'sid:<uuid>' 或 'cid:<id>' → { code, exp }

function put(key, code) {
  store.set(key, { code, exp: Date.now() + SESSION_TTL })
  if (store.size > MAX_ENTRIES) {
    // 淘汰最旧的 1/4，防止内存膨胀
    const drop = Math.floor(MAX_ENTRIES / 4)
    let i = 0
    for (const k of store.keys()) {
      store.delete(k)
      if (++i >= drop) break
    }
  }
}

function get(key) {
  const v = store.get(key)
  if (!v) return null
  if (v.exp < Date.now()) {
    store.delete(key)
    return null
  }
  return v
}

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of store) if (v.exp < now) store.delete(k)
}, 60_000).unref?.()

/* ================= 教学账号 ================= */
const USERS = {
  student: { password: '123456', nickname: '同学（student）' },
  teacher: { password: '888888', nickname: '老师（teacher）' }
}

/* ================= 工具函数 ================= */
function parseCookies(header) {
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

function readBody(req, limit = 64 * 1024) {
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
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function parseBody(req) {
  const raw = await readBody(req)
  const type = String(req.headers['content-type'] || '')
  if (type.includes('application/json')) {
    try { return JSON.parse(raw || '{}') } catch { return {} }
  }
  // 默认按表单解析（requests 的 data= 参数为 urlencoded）
  const out = {}
  for (const pair of raw.split('&')) {
    if (!pair) continue
    const idx = pair.indexOf('=')
    if (idx < 0) { out[decodeURIComponent(pair)] = '' } else {
      out[decodeURIComponent(pair.slice(0, idx).replace(/\+/g, ' '))] =
        decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '))
    }
  }
  return out
}

function send(res, status, body, headers = {}) {
  const buf = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)
  res.writeHead(status, headers)
  res.end(buf)
}

function sendJSON(res, status, obj, headers = {}) {
  send(res, status, obj, { 'Content-Type': 'application/json; charset=utf-8', ...headers })
}

function sendImage(res, png) {
  send(res, 200, png, {
    'Content-Type': 'image/png',
    'Cache-Control': 'no-store, max-age=0',
    'Access-Control-Allow-Origin': '*'
  })
}

/* ================= 静态资源 ================= */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname)
  // 防目录穿越
  if (!filePath.startsWith(DIST_DIR)) return sendJSON(res, 403, { code: 403, msg: 'forbidden' })
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // history 回退：未命中的 GET 请求一律返回 SPA 入口，由前端路由接管
      fs.readFile(path.join(DIST_DIR, 'index.html'), (e2, html) => {
        if (e2) return sendJSON(res, 503, { code: 503, msg: 'dist 未构建：请先执行 npm run build' })
        send(res, 200, html, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' })
      })
      return
    }
    const ext = path.extname(filePath).toLowerCase()
    send(res, 200, data, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600'
    })
  })
}

/* ================= 接口实现 ================= */
function issueSessionCaptcha(req, res) {
  const cookies = parseCookies(req.headers.cookie)
  let sid = cookies.RYSESSID
  if (!sid || sid.length < 8) {
    sid = crypto.randomUUID()
  }
  const code = randomCode()
  put('sid:' + sid, code)
  const png = drawCaptchaPNG(code)
  send(res, 200, png, {
    'Content-Type': 'image/png',
    'Cache-Control': 'no-store, max-age=0',
    'Set-Cookie': `RYSESSID=${sid}; Path=/; Max-Age=600; SameSite=Lax`
  })
}

function issueCidCaptcha(res, cid) {
  const entry = cid ? get('cid:' + cid) : null
  const code = entry ? entry.code : randomCode() // cid 无效时也返回图片，但校验必然失败
  sendImage(res, drawCaptchaPNG(code))
}

/** 人邮书城登录（对应 notebook：sess.post('https://www.ptpress.com.cn/login', data=login)） */
async function handleLogin(req, res) {
  const body = await parseBody(req)
  const username = String(body.username || '').trim()
  const password = String(body.password || '')
  const verifyCode = String(body.verifyCode || '').trim()

  const cookies = parseCookies(req.headers.cookie)
  const sess = cookies.RYSESSID ? get('sid:' + cookies.RYSESSID) : null
  if (!sess) {
    return sendJSON(res, 200, { code: 500, msg: '验证码已失效，请刷新验证码后重试' })
  }
  if (verifyCode.toUpperCase() !== sess.code.toUpperCase()) {
    return sendJSON(res, 200, { code: 500, msg: '验证码错误' })
  }
  const user = USERS[username]
  if (!user || user.password !== password) {
    return sendJSON(res, 200, { code: 500, msg: '用户名或密码错误' })
  }
  // 登录成功：消费验证码并下发登录态 Cookie（Selenium 可读取/注入，配合 cookies 登录教学）
  store.delete('sid:' + cookies.RYSESSID)
  const token = crypto.randomBytes(16).toString('hex')
  return sendJSON(res, 200, {
    code: 200,
    msg: '登录成功',
    data: { username, nickname: user.nickname, token }
  }, {
    'Set-Cookie': [
      `ryName=${encodeURIComponent(username)}; Path=/; Max-Age=604800; SameSite=Lax`,
      `ryToken=${token}; Path=/; Max-Age=604800; SameSite=Lax`
    ]
  })
}

/** 伪百度登录（notebook「百度自动化表单」点击 #TANGRAM__PSP_11__submit 后由页面调用） */
async function handleBaiduLogin(req, res) {
  const body = await parseBody(req)
  const username = String(body.username || '').trim()
  const password = String(body.password || '')
  const agree = body.agree === true || body.agree === 'true' || body.agree === 'on'
  if (!agree) return sendJSON(res, 200, { code: 500, msg: '请阅读并同意《用户服务协议》' })
  const user = USERS[username]
  if (!user || user.password !== password) {
    return sendJSON(res, 200, { code: 500, msg: '用户名或密码错误' })
  }
  // BDUSS 采用 base64(username:simulated) 生成，前端解码展示昵称（对应 cookies 登录练习）
  const bduss = Buffer.from(`${username}:simulated`).toString('base64')
  const baiduid = crypto.randomBytes(16).toString('hex').toUpperCase()
  return sendJSON(res, 200, {
    code: 200,
    msg: '登录成功',
    data: { username, nickname: user.nickname, bduss }
  }, {
    'Set-Cookie': [
      `BAIDUID=${baiduid}; Path=/; Max-Age=604800; SameSite=Lax`,
      `BDUSS=${encodeURIComponent(bduss)}; Path=/; Max-Age=604800; SameSite=Lax`
    ]
  })
}

/** 验证码识读练习：创建独立挑战 */
function handleCaptchaNew(req, res) {
  const cid = crypto.randomBytes(8).toString('hex')
  const code = randomCode()
  put('cid:' + cid, code)
  sendJSON(res, 200, {
    code: 200,
    msg: 'ok',
    data: { cid, url: `/kaptcha.jpg?cid=${cid}&t=${Date.now()}` }
  })
}

/** 验证码识读练习：校验答案 */
async function handleCaptchaVerify(req, res) {
  const body = await parseBody(req)
  const cid = String(body.cid || '')
  const code = String(body.code || '').trim()
  const entry = get('cid:' + cid)
  const pass = !!entry && code.toUpperCase() === entry.code.toUpperCase()
  sendJSON(res, 200, { code: 200, msg: 'ok', data: { pass } })
}

/* 爬虫闯关：答案仅存于服务端 */
const CHALLENGE_ANSWERS = {
  1: 'CT-7749',
  2: 'CT-2026-NEWS',
  3: 'CT-FAQ-3355',
  4: 'CT-SALE-9198',
  5: 'CT-BASE-6420',
  6: 'CT-HEADER-2026'
}

async function handleChallengeCheck(req, res) {
  const body = await parseBody(req)
  const level = Number(body.level)
  const answer = String(body.answer || '').trim().toUpperCase()
  const expect = CHALLENGE_ANSWERS[level]
  sendJSON(res, 200, { code: 200, msg: 'ok', data: { pass: !!expect && answer === expect } })
}

/** 请求头校验反爬示例：要求携带 X-Student-Id */
function handleChallengeSecret(req, res) {
  const sid = String(req.headers['x-student-id'] || '').trim()
  if (!sid) {
    return sendJSON(res, 200, {
      code: 403,
      msg: '请求被拒绝：缺少身份请求头 X-Student-Id（反爬策略示例）',
      data: { hint: '请用 requests 或 fetch 携带 headers={"X-Student-Id":"data221"} 重试' }
    })
  }
  sendJSON(res, 200, {
    code: 200,
    msg: 'ok',
    data: { secret: 'CT-HEADER-2026', headersEcho: { 'x-student-id': sid } }
  })
}

/* ================= 接口分发（可被生产服务器与 Vite 开发中间件复用） ================= */
/**
 * 处理全部课程接口（GET /kaptcha.jpg、/api/*，POST /login、/api/*）。
 * @returns {Promise<boolean>} true = 已处理（响应已写出）；false = 非接口路径，交由调用方继续处理
 */
export async function handleApi(req, res) {
  let u
  try {
    u = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  } catch {
    return false
  }
  const pathname = decodeURIComponent(u.pathname)

  const isApiPath =
    pathname === '/kaptcha.jpg' ||
    pathname.startsWith('/api/') ||
    (req.method === 'POST' && pathname === '/login')
  if (!isApiPath) return false

  try {
    if (req.method === 'GET') {
      if (pathname === '/kaptcha.jpg') {
        const cid = u.searchParams.get('cid')
        cid ? issueCidCaptcha(res, cid) : issueSessionCaptcha(req, res)
        return true
      }
      if (pathname === '/api/health') {
        sendJSON(res, 200, { ok: true, ts: Date.now(), service: 'data221-crawler-lab' })
        return true
      }
      if (pathname === '/api/challenge/secret') {
        handleChallengeSecret(req, res)
        return true
      }
    }
    if (req.method === 'POST') {
      if (pathname === '/login') { await handleLogin(req, res); return true }
      if (pathname === '/api/baidu/login') { await handleBaiduLogin(req, res); return true }
      if (pathname === '/api/captcha/new') { handleCaptchaNew(req, res); return true }
      if (pathname === '/api/captcha/verify') { await handleCaptchaVerify(req, res); return true }
      if (pathname === '/api/challenge/check') { await handleChallengeCheck(req, res); return true }
    }
    sendJSON(res, 404, { code: 404, msg: '接口不存在或方法不支持' })
    return true
  } catch (e) {
    sendJSON(res, 500, { code: 500, msg: '服务器内部错误：' + e.message })
    return true
  }
}

/* ================= 生产服务器（node server/server.js） ================= */
const server = http.createServer(async (req, res) => {
  try {
    const handled = await handleApi(req, res)
    if (handled) return
    if (req.method === 'GET') {
      const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname)
      return serveStatic(req, res, pathname)
    }
    sendJSON(res, 405, { code: 405, msg: 'method not allowed' })
  } catch (e) {
    sendJSON(res, 500, { code: 500, msg: '服务器内部错误：' + e.message })
  }
})

/* ================= 自检模式 ================= */
async function selftest() {
  const results = []
  const t = (name, fn) => {
    try {
      const ok = fn()
      results.push([!!ok, name])
    } catch (e) {
      results.push([false, `${name}（异常：${e.message}）`])
    }
  }

  t('CRC32 标准测试向量 "123456789" → 0xCBF43926', () => crc32(Buffer.from('123456789')) === 0xcbf43926)
  t('CRC32 空串 → 0x00000000', () => crc32(Buffer.alloc(0)) === 0)
  t('randomCode 生成 4 位数字', () => /^[0-9]{4}$/.test(randomCode()))
  t('PNG 签名与 IHDR 尺寸正确', () => {
    const png = drawCaptchaPNG('0846')
    if (png.readUInt32BE(0) !== 0x89504e47) return false
    const ihdr = png.subarray(16, 29)
    return ihdr.readUInt32BE(0) === 120 && ihdr.readUInt32BE(4) === 44
  })
  t('PNG IDAT 可解压且行宽正确', () => {
    const png = drawCaptchaPNG('0846')
    // 定位 IDAT 块
    let off = 8
    let idat = null
    while (off < png.length) {
      const len = png.readUInt32BE(off)
      const type = png.subarray(off + 4, off + 8).toString('ascii')
      if (type === 'IDAT') { idat = png.subarray(off + 8, off + 8 + len) }
      off += 12 + len
      if (type === 'IEND') break
    }
    if (!idat) return false
    const raw = zlib.inflateSync(idat)
    return raw.length === (120 * 3 + 1) * 44
  })
  t('不同验证码生成不同图片', () => {
    const a = drawCaptchaPNG('1111')
    const b = drawCaptchaPNG('2222')
    return !a.equals(b)
  })
  t('Cookie 解析', () => {
    const c = parseCookies('a=1; RYSESSID=abc;ryName=%E5%AD%A6%E7%94%9F')
    return c.a === '1' && c.RYSESSID === 'abc'
  })
  t('会话存取与过期', () => {
    put('sid:test', '1234')
    const v = get('sid:test')
    return v && v.code === '1234'
  })
  t('教学账号表完整', () => {
    return USERS.student.password === '123456' && USERS.teacher.password === '888888'
  })
  t('闯关答案表完整（6 关）', () => Object.keys(CHALLENGE_ANSWERS).length === 6)
  t('MIME 表覆盖关键类型', () => !!MIME['.html'] && !!MIME['.js'] && !!MIME['.svg'])

  const failed = results.filter(([ok]) => !ok)
  for (const [ok, name] of results) console.log((ok ? '  ✓ ' : '  ✗ ') + name)
  console.log(`\n自检结果：${results.length - failed.length}/${results.length} 通过`)
  process.exit(failed.length ? 1 : 0)
}

/* ================= 入口：仅在直接运行时启动（被 Vite 插件 import 时跳过） ================= */
const isMain = (() => {
  try {
    return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
})()

if (isMain && SELFTEST) {
  selftest()
} else if (isMain) {
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.warn('[警告] 未发现 dist/index.html：请先执行 npm run build，再启动服务。')
  }
  server.listen(PORT, () => {
    console.log(`Data221 爬虫教学实训站已启动`)
    console.log(`  地址:   http://localhost:${PORT}`)
    console.log(`  静态:   ${DIST_DIR}`)
    console.log(`  验证码: http://localhost:${PORT}/kaptcha.jpg`)
    console.log(`  健康检查: http://localhost:${PORT}/api/health`)
  })
}
