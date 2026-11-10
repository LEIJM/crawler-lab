/**
 * Data221 爬虫教学实训站 · 零依赖 Node 服务器
 * ---------------------------------------------------------------
 * 仅使用 Node 内置模块，无需 npm install 即可运行，适合内网离线部署。
 *
 * 职责：
 * 1. 托管 Vite 构建产物 dist/（含 history 路由回退，保证 /login、/shopping/index 等
 *    深链接直达 SPA 页面）；
 * 2. 提供课程练习所需的全部接口（实现见 server/api.js，本文件只做 HTTP 适配）：
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
 *
 * Cloudflare：同一套 api.js 由 worker/index.js 与 Pages Functions 调用。
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { drawCaptchaPNG, randomCode, crc32 } from './captcha.js'
import { USERS, CHALLENGE_ANSWERS, parseCookies } from './api.js'
import { handleApi } from './http-adapter.js'
import { seal, unseal, issueCaptchaToken, readCaptchaToken } from './token.js'

export { handleApi }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')
const PORT = Number(process.env.PORT) || 8188
const SELFTEST = process.argv.includes('--selftest')

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

function send(res, status, body, headers = {}) {
  const buf = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)
  res.writeHead(status, headers)
  res.end(buf)
}

function sendJSON(res, status, obj, headers = {}) {
  send(res, status, obj, { 'Content-Type': 'application/json; charset=utf-8', ...headers })
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname)
  if (!filePath.startsWith(DIST_DIR)) return sendJSON(res, 403, { code: 403, msg: 'forbidden' })
  fs.readFile(filePath, (err, data) => {
    if (err) {
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
  const t = async (name, fn) => {
    try {
      const ok = await fn()
      results.push([!!ok, name])
    } catch (e) {
      results.push([false, `${name}（异常：${e.message}）`])
    }
  }

  await t('CRC32 标准测试向量 "123456789" → 0xCBF43926', () => crc32(Buffer.from('123456789')) === 0xcbf43926)
  await t('CRC32 空串 → 0x00000000', () => crc32(Buffer.alloc(0)) === 0)
  await t('randomCode 生成 4 位数字', () => /^[0-9]{4}$/.test(randomCode()))
  await t('PNG 签名与 IHDR 尺寸正确', () => {
    const png = drawCaptchaPNG('0846')
    if (png.readUInt32BE(0) !== 0x89504e47) return false
    const ihdr = png.subarray(16, 29)
    return ihdr.readUInt32BE(0) === 120 && ihdr.readUInt32BE(4) === 44
  })
  await t('PNG IDAT 可解压且行宽正确', () => {
    const png = drawCaptchaPNG('0846')
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
  await t('不同验证码生成不同图片', () => {
    const a = drawCaptchaPNG('1111')
    const b = drawCaptchaPNG('2222')
    return !a.equals(b)
  })
  await t('Cookie 解析', () => {
    const c = parseCookies('a=1; RYSESSID=abc;ryName=%E5%AD%A6%E7%94%9F')
    return c.a === '1' && c.RYSESSID === 'abc'
  })
  await t('验证码令牌封解与过期', async () => {
    const token = await issueCaptchaToken('1234')
    const v = await readCaptchaToken(token)
    const expired = await unseal(await seal({ code: '0000', exp: Date.now() - 1 }))
    return v && v.code === '1234' && expired === null
  })
  await t('教学账号表完整', () => {
    return USERS.student.password === '123456' && USERS.teacher.password === '888888'
  })
  await t('闯关答案表完整（6 关）', () => Object.keys(CHALLENGE_ANSWERS).length === 6)
  await t('MIME 表覆盖关键类型', () => !!MIME['.html'] && !!MIME['.js'] && !!MIME['.svg'])

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
