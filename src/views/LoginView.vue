<script setup>
/**
 * 伪人邮 · 会员登录页（/login）
 *
 * DOM 契约（对应 notebook「模拟登录」与「自动化提交表单」两个单元格）：
 *   //*[@id="loginForm"]/div[1]/input              用户名输入框
 *   //*[@id="loginForm"]/div[2]/input              密码输入框
 *   //*[@id="loginForm"]/div[3]/div[1]/div/input   验证码输入框
 *   .verCodeImg                                    验证码图片（可被 img.screenshot_as_png 截图）
 *   #loginBtn                                      登录按钮
 *
 * 因此 #loginForm 的 div 子元素必须恰好为 3 个 .form-row，
 * 且用户名/密码 input 必须是 form-row 的直接子元素（不能包额外 div）。
 *
 * 接口契约：POST /login（username / password / verifyCode），
 * 与 notebook 中 requests 的 sess.post(url, data=login) 使用同一接口；
 * 验证码由 GET /kaptcha.jpg 下发并绑定 Session（RYSESSID Cookie）。
 */
import { ref, onMounted } from 'vue'
import { ryUser } from '../lib/auth.js'

const username = ref('')
const password = ref('')
const verifyCode = ref('')
const msg = ref('')
const msgType = ref('')       // '' | 'ok' | 'err'
const loading = ref(false)
const captchaSrc = ref('/kaptcha.jpg')
const alreadyLogin = ref(null)

function refreshCaptcha() {
  // 点击图片刷新验证码（服务端更新当前会话的验证码文本）
  captchaSrc.value = `/kaptcha.jpg?t=${Date.now()}`
}

// Vue 模板表达式无法访问 window 全局，须封装为方法
function openSearch() {
  window.open('/search?keyword=&jc=', '_blank')
}

async function submitLogin() {
  msg.value = ''
  if (!username.value.trim() || !password.value || !verifyCode.value.trim()) {
    msg.value = '请输入用户名、密码和验证码'
    msgType.value = 'err'
    return
  }
  loading.value = true
  try {
    const body = new URLSearchParams({
      username: username.value.trim(),
      password: password.value,
      verifyCode: verifyCode.value.trim()
    })
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'same-origin',
      body: body.toString()
    })
    const data = await res.json()
    if (data.code === 200) {
      msg.value = '登录成功，正在跳转书城首页…'
      msgType.value = 'ok'
      setTimeout(() => { window.location.href = '/shopping/index' }, 700)
    } else {
      msg.value = data.msg || '登录失败'
      msgType.value = 'err'
      verifyCode.value = ''
      refreshCaptcha()
    }
  } catch (e) {
    msg.value = '网络异常，请稍后重试'
    msgType.value = 'err'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  document.title = '会员登录-人民邮电出版社'
  alreadyLogin.value = ryUser()
  refreshCaptcha()
})
</script>

<template>
  <div class="pt-page">
    <div id="header">
      <div class="h-inner">
        <div class="h-row">
          <div class="h-left">
            <a class="logo" href="/shopping/index">
              <span class="logo-badge">PT</span>
              <span class="logo-text">人民邮电出版社</span>
            </a>
            <span class="slogan">会员登录</span>
          </div>
          <div class="h-mid">
            <div class="h-nav">
              <a href="/shopping/index">首页</a>
              <a href="javascript:;">图书分类</a>
              <a href="javascript:;">新书推荐</a>
              <a href="javascript:;">排行榜</a>
              <a href="/login">会员中心</a>
            </div>
            <div class="h-notice"><span class="notice-bar">登录后可享受教材征订、样书申请等服务</span></div>
            <div class="h-search">
              <input type="text" class="search-input" aria-label="搜索书名 / 作者 / 关键词"
                     placeholder="请输入书名 / 作者 / 关键词">
              <button class="search-btn" type="button" @click="openSearch">搜索</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="login-body">
      <div class="login-card">
        <h2 class="login-title">会员登录</h2>
        <p class="login-sub">登录成功后将获得 Cookie 登录态（ryName / ryToken），可用于 Cookies 注入练习</p>

        <div v-if="alreadyLogin" class="lab-note warn" style="margin-bottom:14px;">
          <span>当前浏览器已存在登录态：{{ alreadyLogin.nickname }}。重新登录会覆盖登录态。</span>
        </div>

        <form id="loginForm" @submit.prevent="submitLogin">
          <div class="form-row">
            <label class="row-label" for="username">用户名</label>
            <input id="username" v-model="username" class="row-input" type="text" name="username"
                   placeholder="教学账号：student" autocomplete="off">
          </div>
          <div class="form-row">
            <label class="row-label" for="password">密码</label>
            <input id="password" v-model="password" class="row-input" type="password" name="password"
                   placeholder="教学账号密码：123456" autocomplete="off">
          </div>
          <div class="form-row code-row">
            <div class="code-box">
              <div class="code-input">
                <input id="verifyCode" v-model="verifyCode" class="row-input code-input-el" type="text"
                       name="verifyCode" maxlength="4" placeholder="验证码" autocomplete="off">
              </div>
              <img class="verCodeImg" :src="captchaSrc" alt="验证码，点击图片可刷新" width="120" height="44"
                   title="看不清？点击图片刷新" @click="refreshCaptcha">
            </div>
            <p class="code-tip">看不清？点击图片刷新</p>
          </div>

          <!-- 改 type="submit"：密码框回车可提交（DOM 契约仅约束 #loginBtn 的 id） -->
          <button id="loginBtn" class="login-btn" type="submit" :disabled="loading">
            {{ loading ? '登录中…' : '登 录' }}
          </button>
          <p id="loginMsg" class="login-msg" :class="msgType" role="status">{{ msg || ' ' }}</p>
        </form>

        <div class="login-accounts">
          <p class="acc-title">教学专用账号（本站公开）：</p>
          <table class="acc-table">
            <tbody>
              <tr><td>student</td><td>123456</td><td>学生账号</td></tr>
              <tr><td>teacher</td><td>888888</td><td>教师账号</td></tr>
            </tbody>
          </table>
        </div>

        <div class="login-teacher-tip">
          <p><b>Selenium 练习提示</b>（notebook 单元格对照）：</p>
          <p>① 验证码图片可被元素级截图：<code class="code-inline">driver.find_element(By.XPATH, '//*[@class="verCodeImg"]').screenshot_as_png</code></p>
          <p>② requests 练习时请用 <code class="code-inline">requests.Session()</code> 保证验证码与登录请求共用同一 Cookie（RYSESSID）。</p>
        </div>
      </div>
    </div>

    <footer class="pt-footer">
      <p>人民邮电出版社（教学模拟站） · 仅用于 Data221 课程爬虫实训</p>
    </footer>
  </div>
</template>

<style scoped>
.pt-page { min-height: 100vh; background: #f2f3f5; font-family: var(--lab-font); display: flex; flex-direction: column; }
#header { background: #fff; border-bottom: 2px solid #e60012; }
.h-inner { padding: 0 24px; }
.h-row { display: flex; align-items: center; gap: 20px; padding: 14px 0; }
.h-left { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.logo { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
.logo-badge { width: 38px; height: 38px; background: #e60012; color: #fff; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; }
.logo-text { font-size: 20px; font-weight: 700; color: #2a2a2a; }
.slogan { font-size: 12px; color: #999; border-left: 1px solid #eee; padding-left: 12px; }
.h-mid { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
.h-nav { display: flex; gap: 22px; font-size: 14px; }
.h-nav a { color: #333; text-decoration: none; }
.h-notice { font-size: 12px; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 2px 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h-search { display: flex; align-items: stretch; }
.search-input { width: 380px; max-width: 60vw; height: 38px; border: 2px solid #e60012; border-right: none; border-radius: 4px 0 0 4px; padding: 0 12px; font-size: 13.5px; outline: none; box-sizing: border-box; }
.search-btn { height: 38px; padding: 0 26px; background: #e60012; color: #fff; font-size: 14px; border: none; border-radius: 0 4px 4px 0; cursor: pointer; }

.login-body {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 20px;
  background: linear-gradient(180deg, #f2f3f5 0%, #eceef2 100%);
}
.login-card {
  width: 420px;
  max-width: 100%;
  background: #fff;
  border-radius: 14px;
  padding: 30px 34px 26px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.07);
}
.login-title { font-size: 21px; margin: 0 0 6px; color: #222; }
.login-sub { font-size: 12.5px; color: #999; margin: 0 0 22px; }

/* 表单行：div[1]/div[2]/div[3] 的索引为教学契约 */
.form-row { margin-bottom: 16px; }
.row-label {
  display: block;
  font-size: 13px;
  color: #555;
  margin-bottom: 6px;
}
.row-input {
  width: 100%;
  height: 42px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color .15s, box-shadow .15s;
}
.row-input:focus { border-color: #e60012; box-shadow: 0 0 0 3px rgba(230,0,18,0.08); }
.code-row { margin-bottom: 20px; }
.code-box { display: flex; align-items: center; gap: 10px; }
.code-input { flex: 1; min-width: 0; }
.code-input-el { letter-spacing: 6px; font-size: 16px; }
.verCodeImg {
  height: 44px;
  width: 120px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  background: #fafafa;
  flex: 0 0 auto;
}
.verCodeImg:hover { border-color: #e60012; }
.code-tip { margin: 8px 0 0; font-size: 12px; color: #aaa; }

.login-btn {
  width: 100%;
  height: 44px;
  background: #e60012;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 8px;
  cursor: pointer;
}
.login-btn:hover { background: #c7000f; }
.login-btn:disabled { opacity: .6; cursor: not-allowed; }
.login-msg {
  min-height: 20px;
  margin: 10px 0 0;
  font-size: 13px;
  text-align: center;
}
.login-msg.err { color: #e60012; }
.login-msg.ok { color: #16a34a; }

.login-accounts {
  margin-top: 18px;
  background: #fff7f7;
  border: 1px dashed #f5b5b5;
  border-radius: 8px;
  padding: 10px 14px;
}
.acc-title { margin: 0 0 6px; font-size: 12.5px; color: #b45309; }
.acc-table { width: 100%; font-size: 12.5px; border-collapse: collapse; }
.acc-table td { padding: 3px 6px; color: #555; font-family: var(--lab-mono); }
.acc-table td:last-child { font-family: var(--lab-font); color: #999; }

.login-teacher-tip {
  margin-top: 14px;
  font-size: 13px;
  color: #5f6b7a; /* Selenium 练习提示：对比度 ≥ 4.5:1（原 #888 约 3.5:1） */
  line-height: 1.9;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}
.login-teacher-tip p { margin: 0 0 4px; }

.pt-footer { background: #2a2a2a; color: #bbb; text-align: center; padding: 22px 16px; font-size: 12.5px; }
</style>
