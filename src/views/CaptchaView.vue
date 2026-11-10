<script setup>
/**
 * 验证码识读练习（/captcha）
 * 对应 notebook「识别验证码」环节：
 *   1. 页面用 /api/captcha/new 领取一张绑定 cid 的验证码；
 *   2. 人工识读后提交到 /api/captcha/verify 校验；
 *   3. 同时给出 requests 练习参考代码（学生可在 Jupyter 中复现）。
 */
import { ref, computed } from 'vue'

const cid = ref('')
const imgUrl = ref('')
const inputCode = ref('')
const result = ref(null)   // null | true | false
const loading = ref(false)
const total = ref(0)
const correct = ref(0)

async function newCaptcha() {
  inputCode.value = ''
  result.value = null
  loading.value = true
  try {
    const res = await fetch('/api/captcha/new', { method: 'POST' })
    const data = await res.json()
    cid.value = data.data.cid
    imgUrl.value = data.data.url
  } finally {
    loading.value = false
  }
}

async function verify() {
  if (!inputCode.value.trim() || !cid.value) return
  loading.value = true
  try {
    const res = await fetch('/api/captcha/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cid: cid.value, code: inputCode.value.trim() })
    })
    const data = await res.json()
    result.value = data.data.pass
    total.value++
    if (data.data.pass) correct.value++
  } finally {
    loading.value = false
  }
}

const accuracy = computed(() => (total.value === 0 ? 0 : Math.round((correct.value / total.value) * 100)))

const PY_CODE = `import requests
import matplotlib.pyplot as plt

# 1. 领取一张验证码（返回 cid 与图片地址）
base = 'http://SERVER:8188'
r = requests.post(base + '/api/captcha/new').json()
cid, url = r['data']['cid'], r['data']['url']
print('cid =', cid)

# 2. 下载并显示图片
img = requests.get(base + url).content
with open('./kaptcha.jpg', 'wb') as f:
    f.write(img)
pic = plt.imread('./kaptcha.jpg')
plt.imshow(pic)
plt.show()

# 3. 人工识读后提交校验
code = input('请输入验证码：')
res = requests.post(base + '/api/captcha/verify',
                    json={'cid': cid, 'code': code}).json()
print('校验结果：', res['data']['pass'])`

import { onMounted } from 'vue'
onMounted(() => {
  document.title = '验证码练习 · Data221 实训站'
  newCaptcha()
})
</script>

<template>
  <div class="lab-container cp-wrap">
    <div class="cp-head">
      <div>
        <h2>验证码识读练习</h2>
        <p class="cp-sub">与登录接口使用同一套验证码服务。这里的验证码与 cid 绑定（而非 Session），方便反复练习与课堂比拼正确率。</p>
      </div>
      <span class="lab-tag blue">配合 notebook 单元格 4 / 5</span>
    </div>

    <div class="cp-layout">
      <div class="lab-card cp-card">
        <div class="cp-img-area">
          <img v-if="imgUrl" :src="imgUrl" alt="验证码图片" class="cp-img" @click="newCaptcha">
          <div v-else class="cp-placeholder">点击下方按钮领取验证码</div>
        </div>
        <p class="cp-tip">看不清可点击图片或「换一张」刷新</p>
        <div class="cp-form">
          <input v-model="inputCode" class="cp-input" maxlength="4" placeholder="输入图中 4 位数字"
                 @keydown.enter="verify">
          <button class="lab-btn" :disabled="loading || !cid" @click="verify">校验</button>
          <button class="lab-btn ghost" :disabled="loading" @click="newCaptcha">换一张</button>
        </div>
        <p v-if="result === true" class="cp-result ok">✓ 识读正确！</p>
        <p v-else-if="result === false" class="cp-result err">✗ 识读有误，再试一张吧</p>
        <div class="cp-stats">
          <span>累计练习：{{ total }} 次</span>
          <span>正确：{{ correct }} 次</span>
          <span>正确率：{{ accuracy }}%</span>
        </div>
      </div>

      <div class="lab-card cp-code-card">
        <h4>requests 练习参考代码</h4>
        <p class="cp-code-hint">在 Jupyter 中运行（把 SERVER 换成实训站地址），即可复现 notebook 的验证码识读流程：</p>
        <pre class="lab-code">{{ PY_CODE }}</pre>
        <div class="lab-note info" style="margin-top:14px;">
          <span>登录页（/login）的验证码走 <b>Session</b>（RYSESSID Cookie），必须用 requests.Session() 才能校验成功；
            本练习页走 <b>cid</b> 机制，两者都源自 /kaptcha.jpg 图像服务。</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cp-wrap { padding-top: 30px; padding-bottom: 50px; }
.cp-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 14px; flex-wrap: wrap; }
.cp-head h2 { font-size: 24px; }
.cp-sub { color: var(--lab-ink-3); font-size: 13.5px; margin: 6px 0 0; max-width: 620px; }
.cp-layout { display: grid; grid-template-columns: 1fr 1.3fr; gap: 20px; align-items: start; }
@media (max-width: 980px) { .cp-layout { grid-template-columns: 1fr; } }

.cp-card { padding: 26px; text-align: center; }
.cp-img-area { display: flex; justify-content: center; }
.cp-img {
  height: 88px; width: 240px; border: 2px solid var(--lab-line); border-radius: 10px;
  background: #fff; cursor: pointer;
}
.cp-img:hover { border-color: var(--lab-blue); }
.cp-placeholder {
  height: 88px; width: 240px; display: flex; align-items: center; justify-content: center;
  color: #94a3b8; font-size: 13px; border: 2px dashed var(--lab-line); border-radius: 10px;
}
.cp-tip { color: var(--lab-ink-3); font-size: 12.5px; margin: 10px 0 18px; }
.cp-form { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.cp-input {
  width: 150px; height: 40px; border: 1.5px solid var(--lab-line); border-radius: 9px;
  text-align: center; font-size: 18px; letter-spacing: 8px; outline: none; font-family: var(--lab-mono);
}
.cp-input:focus { border-color: var(--lab-blue); }
.cp-result { margin: 16px 0 0; font-size: 14px; font-weight: 700; }
.cp-result.ok { color: var(--lab-green); }
.cp-result.err { color: var(--lab-red); }
.cp-stats {
  margin-top: 18px; padding-top: 14px; border-top: 1px dashed var(--lab-line);
  display: flex; justify-content: center; gap: 22px; color: var(--lab-ink-3); font-size: 13px;
}

.cp-code-card { padding: 22px; }
.cp-code-card h4 { margin: 0 0 6px; font-size: 16px; }
.cp-code-hint { font-size: 12.5px; color: var(--lab-ink-3); margin: 0 0 12px; }
</style>
