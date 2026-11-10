/**
 * 验证码图片生成器（零外部依赖）
 * ---------------------------------------------------------------
 * 使用 Node 内置模块（zlib + 手写 CRC32）把四位数字验证码渲染为 PNG 图片，
 * 接口路径 /kaptcha.jpg 与真实站点保持一致（对应 notebook 中
 * requests.get('https://www.ptpress.com.cn/kaptcha.jpg') 的练习）。
 *
 * 说明：文件扩展名为 .jpg 但内容为标准 PNG（浏览器与 PIL 均按文件头自动识别，
 * matplotlib 的 plt.imread 亦可直接读取），教学文档中已注明。
 */
import zlib from 'node:zlib'

/* ---------------- CRC32 ---------------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
    }
    t[n] = c
  }
  return t
})()

export function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

/* ---------------- PNG 编码 ---------------- */
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

/** RGB 像素缓冲 → PNG Buffer */
export function encodePNG(width, height, rgb) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // color type: truecolor RGB
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  const raw = Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0 // filter: none
    rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3)
  }
  const idat = zlib.deflateSync(raw, { level: 6 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

/* ---------------- 画布工具 ---------------- */
const W = 120
const H = 44
const BG = [252, 252, 253]
const DIGIT_COLORS = [
  [26, 26, 26], [17, 85, 160], [168, 32, 26], [37, 116, 61], [103, 78, 167], [6, 92, 96]
]

class Canvas {
  constructor() {
    this.w = W
    this.h = H
    this.px = Buffer.alloc(W * H * 3)
    for (let i = 0; i < W * H; i++) this.px.set(BG, i * 3)
  }
  set(x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const i = (y * this.w + x) * 3
    this.px[i] = c[0]
    this.px[i + 1] = c[1]
    this.px[i + 2] = c[2]
  }
  rect(x, y, w, h, c) {
    const x0 = Math.round(x), y0 = Math.round(y)
    const x1 = Math.round(x + w), y1 = Math.round(y + h)
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) this.set(xx, yy, c)
    }
  }
  line(x0, y0, x1, y1, c) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      this.set(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), c)
    }
  }
}

/* ---------------- 七段数码管字形 ---------------- */
/* 段序: a(上) b(右上) c(右下) d(下) e(左下) f(左上) g(中) */
const SEGMENTS = {
  0: [1, 1, 1, 1, 1, 1, 0],
  1: [0, 1, 1, 0, 0, 0, 0],
  2: [1, 1, 0, 1, 1, 0, 1],
  3: [1, 1, 1, 1, 0, 0, 1],
  4: [0, 1, 1, 0, 0, 1, 1],
  5: [1, 0, 1, 1, 0, 1, 1],
  6: [1, 0, 1, 1, 1, 1, 1],
  7: [1, 1, 1, 0, 0, 0, 0],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 0, 1, 1]
}

function drawDigit(cv, digit, x, y, dw, dh, t, color) {
  const seg = SEGMENTS[digit]
  const half = dh / 2
  if (seg[0]) cv.rect(x + t, y, dw - 2 * t, t, color)              // a
  if (seg[6]) cv.rect(x + t, y + half - t / 2, dw - 2 * t, t, color) // g
  if (seg[3]) cv.rect(x + t, y + dh - t, dw - 2 * t, t, color)     // d
  if (seg[5]) cv.rect(x, y + t, t, half - t, color)                // f
  if (seg[1]) cv.rect(x + dw - t, y + t, t, half - t, color)      // b
  if (seg[4]) cv.rect(x, y + half + t / 2, t, half - t, color)    // e
  if (seg[2]) cv.rect(x + dw - t, y + half + t / 2, t, half - t, color) // c
}

/* ---------------- 验证码渲染 ---------------- */
/** 生成随机四位数字验证码文本 */
export function randomCode(rng = Math.random) {
  let s = ''
  for (let i = 0; i < 4; i++) s += String(Math.floor(rng() * 10))
  return s
}

/** 渲染验证码 PNG（code：4 位数字字符串） */
export function drawCaptchaPNG(code) {
  const cv = new Canvas()
  const rng = Math.random

  // 四个数字：位置抖动 + 随机颜色
  const dw = 17, dh = 28, t = 4
  for (let i = 0; i < 4; i++) {
    const digit = Number(code[i])
    const color = DIGIT_COLORS[Math.floor(rng() * DIGIT_COLORS.length)]
    const x = 9 + i * 27 + (rng() * 4 - 2)
    const y = 8 + (rng() * 6 - 3)
    drawDigit(cv, digit, x, y, dw, dh, t, color)
  }

  // 3 条浅色干扰线
  for (let l = 0; l < 3; l++) {
    const c = [186 + Math.floor(rng() * 30), 192 + Math.floor(rng() * 30), 205 + Math.floor(rng() * 30)]
    cv.line(rng() * W, rng() * H, rng() * W, rng() * H, c)
  }

  // 随机噪点
  for (let d = 0; d < 60; d++) {
    const v = 205 + Math.floor(rng() * 40)
    cv.set(Math.floor(rng() * W), Math.floor(rng() * H), [v, v, v + 5])
  }

  return encodePNG(cv.w, cv.h, cv.px)
}

export { W as CAPTCHA_W, H as CAPTCHA_H }
