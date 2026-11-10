/**
 * Cookie 工具与登录态读取
 *
 * 教学要点（对应 notebook「百度 cookies 登录」环节）：
 * - 登录成功后服务器通过 Set-Cookie 下发 BDUSS / ryToken 等凭据 Cookie；
 * - 页面刷新后依据 document.cookie 判断登录态；
 * - Selenium 可用 driver.add_cookie() 注入这些 Cookie 实现"免密"登录。
 */

export function getCookie(name) {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : ''
}

export function setCookie(name, value, days = 7) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${exp}`
}

export function delCookie(name) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

/** 伪百度登录态：BDUSS 存在即视为已登录 */
export function baiduUser() {
  const bduss = getCookie('BDUSS')
  if (!bduss) return null
  let nickname = '已登录用户'
  try {
    // BDUSS 由服务器 base64(username:fake) 生成
    const decoded = decodeURIComponent(escape(atob(bduss)))
    const name = decoded.split(':')[0]
    if (name) nickname = name
  } catch (e) { /* 无法解码时使用默认昵称 */ }
  return { nickname, bduss }
}

/** 伪人邮登录态 */
export function ryUser() {
  const name = getCookie('ryName')
  if (!name) return null
  return { nickname: name, token: getCookie('ryToken') }
}

export function logoutBaidu() {
  delCookie('BDUSS')
  delCookie('BAIDUID')
}

export function logoutRy() {
  delCookie('ryName')
  delCookie('ryToken')
}
