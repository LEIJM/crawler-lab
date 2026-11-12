<script setup>
/**
 * 教学文档（/docs）
 * 面向教师备课与学生自学：站点地图、API 契约、账号与合规说明。
 * 部署指南见项目 README（快速开始 / 内网离线 / Cloudflare）。
 */
import { onMounted, ref } from 'vue'

const health = ref('检测中…')
const healthState = ref('loading')   // loading | ok | err
async function checkHealth() {
  healthState.value = 'loading'
  health.value = '检测中…'
  try {
    const res = await fetch('/api/health')
    const data = await res.json()
    if (data.ok) {
      healthState.value = 'ok'
      health.value = `服务正常 · ${new Date(data.ts).toLocaleString()}`
    } else {
      healthState.value = 'err'
      health.value = '服务响应异常'
    }
  } catch {
    healthState.value = 'err'
    health.value = '接口不可达（开发模式下需先启动后端：node server/server.js）'
  }
}
onMounted(() => {
  document.title = '教学文档 · Data221 实训站'
  checkHealth()
})

const SITEMAP = [
  { path: '/', name: '教学总领页', note: '课程导航、notebook 对照、快速开始' },
  { path: '/baidu', name: '伪百度首页', note: '#kw / #su / #s-top-loginbtn' },
  { path: '/s?wd=转本&pn=0', name: '伪百度结果页', note: 'h3.t、#page 分页、标题含关键词' },
  { path: '/shopping/index', name: '伪人邮·书城首页', note: '头部搜索框契约（notebook 路径一致）' },
  { path: '/search?keyword=大数据&jc=', name: '伪人邮·搜索结果', note: '.book_item > a > p；新窗口打开' },
  { path: '/shopping/detail?isbn=…', name: '图书详情页', note: '延伸练习：结构化数据抓取' },
  { path: '/login', name: '伪人邮·会员登录', note: '#loginForm 三段式结构 + .verCodeImg' },
  { path: '/kaptcha.jpg', name: '验证码图片接口', note: 'Session 绑定；内容为 PNG（扩展名沿袭原站）' },
  { path: '/playground', name: '选择器练习场', note: 'CSS / XPath 实时验证' },
  { path: '/challenge', name: '爬虫闯关', note: '6 关递进实训' },
  { path: '/captcha', name: '验证码识读练习', note: 'cid 机制，可反复练习' },
  { path: '/docs', name: '教学文档', note: '本页' }
]

const ACCOUNTS = [
  { site: '伪人邮书城（登录页）', user: 'student', pwd: '123456', note: '学生账号' },
  { site: '伪人邮书城（登录页）', user: 'teacher', pwd: '888888', note: '教师账号' },
  { site: '伪百度（登录弹窗）', user: 'student', pwd: '123456', note: '与书城共用教学账号' }
]

// 常见报错与教学案例（P1 新增：学生碰报错时可在站内找到对照，不必翻 README）
const ERRORS = [
  {
    name: '翻页陷入无限往返（循环终止条件）',
    scene: '百度翻页到末页',
    when: '循环点击 a[last()]「下一页」翻页：第 1~9 页正常，翻到第 10 页后「下一页」消失，此时 a[last()] 命中的是「上一页」——脚本被带回第 9 页，「下一页」再次出现……如此 9↔10 无限往返。',
    why: '末页确实没有「下一页」，但分页块里还有「上一页」和其他页码链接，a[last()] 在末页指向的不再是「下一页」。',
    how: '每轮先检查「下一页」是否存在再点击：next = driver.find_elements(By.XPATH, \'//a[text()="下一页>"]\')；为空则退出循环。或断言当前页码小于最大页数。这是比异常捕获更稳妥的循环终止写法。'
  },
  {
    name: 'NoSuchElementException',
    scene: '定位不存在的元素',
    when: 'find_element() 定位一个当前页面不存在的元素（如末页的「下一页」、练习场中标注「→ 其他页验证」的选择器）。',
    why: '元素确实不在当前 DOM 中——异常本身是 Selenium 告诉你「找不到」的正常方式。',
    how: '用 find_elements()（返回列表不抛异常）先判存在，或 try/except NoSuchElementException 优雅处理。'
  },
  {
    name: '{"code":500,"msg":"验证码已失效，请刷新验证码后重试"}',
    scene: 'requests 登录',
    when: 'POST /login 返回验证码失效。',
    why: '验证码与 RYSESSID 会话绑定且有效期仅 2 分钟。常见原因：没用 requests.Session（验证码和登录不在同一会话）；或取码后超过 2 分钟才提交。',
    how: 'sess = requests.Session() 先 sess.get(kaptcha) 再 sess.post(login)，并尽快提交；超时后重新取码。'
  },
  {
    name: '{"code":500,"msg":"验证码错误"}',
    scene: 'requests 登录',
    when: 'POST /login 返回验证码错误。',
    why: 'verifyCode 与会话验证码不一致；注意本站验证码是 4 位数字，区分大小写的暗号类答案需完整复制。',
    how: '重新加载验证码图片仔细识读（plt.imshow 放大看），或用 img.screenshot_as_png 元素级截图后人工识读。'
  },
  {
    name: '403 请求被拒绝',
    scene: '闯关第 6 关 /api/challenge/secret',
    when: '不带 X-Student-Id 请求头时返回 {"code":403,...}。',
    why: '接口要求身份请求头，这是请求头反爬的最小示例。',
    how: 'requests.get(url, headers={\'X-Student-Id\': \'data221\'})；两种响应都请各复现一次再提交暗号。'
  },
  {
    name: '「用户名或密码错误」',
    scene: '登录（人邮 / 百度）',
    when: '用 notebook 原代码 secret 模块里的真实账号登录失败。',
    why: 'notebook 的 ryuser / bdpwd 是原站真实账号，模拟站不认识；这本身就是一次接口行为观察练习。',
    how: '改用教学账号 student/123456 或 teacher/888888（见第 2 节账号表）。'
  }
]

const APIS = [
  {
    method: 'GET',
    path: '/kaptcha.jpg',
    desc: '图形验证码。无 cid 参数时绑定 Session：响应携带 Set-Cookie: RYSESSID，10 分钟有效；带 ?cid=xxx 时返回该挑战的图片。',
    sample: `# 对应 notebook 单元格 4
img = requests.get('https://crawler-lab.030516.xyz/kaptcha.jpg')
with open('./kaptcha.jpg', 'wb') as f:
    f.write(img.content)`
  },
  {
    method: 'POST',
    path: '/login',
    desc: '书城登录。表单字段 username / password / verifyCode；验证码取自当前 Session（RYSESSID），失败提示验证码失效/错误。',
    sample: `# 对应 notebook 单元格 8
sess = requests.Session()
sess.get('https://crawler-lab.030516.xyz/kaptcha.jpg')   # 1. 先取验证码（种下 RYSESSID）
code = input('请输入验证码：')                # 2. 人工识读
res = sess.post('https://crawler-lab.030516.xyz/login', data={
    'username': 'student', 'password': '123456', 'verifyCode': code
})
print(res.json())   # {"code":200,"msg":"登录成功",...}；成功后携带 Set-Cookie: ryName / ryToken`
  },
  {
    method: 'POST',
    path: '/api/baidu/login',
    desc: '伪百度登录。JSON 字段 username / password / agree。成功后 Set-Cookie: BAIDUID 与 BDUSS（用于 cookies 注入教学）。',
    sample: `# 页面登录后，可在 DevTools → Application → Cookies 复制 BDUSS，
# 再用 notebook 单元格 14 的 driver.add_cookie({'name':'BDUSS','value':'…'}) 注入`
  },
  {
    method: 'POST',
    path: '/api/captcha/new',
    desc: '验证码练习：领取独立挑战。返回 {data:{cid, url}}，图片地址即 /kaptcha.jpg?cid=…。',
    sample: `r = requests.post('https://crawler-lab.030516.xyz/api/captcha/new').json()
print(r['data']['cid'], r['data']['url'])`
  },
  {
    method: 'POST',
    path: '/api/captcha/verify',
    desc: '验证码练习：校验答案。JSON 字段 cid / code，返回 {data:{pass:true|false}}。',
    sample: `res = requests.post('https://crawler-lab.030516.xyz/api/captcha/verify',
        json={'cid': cid, 'code': code}).json()
print(res['data']['pass'])`
  },
  {
    method: 'POST',
    path: '/api/challenge/check',
    desc: '闯关答案校验。JSON 字段 level(1-6) / answer。答案仅存于服务端。',
    sample: `res = requests.post('https://crawler-lab.030516.xyz/api/challenge/check',
        json={'level': 1, 'answer': 'CT-XXXX'}).json()
print(res['data']['pass'])`
  },
  {
    method: 'GET',
    path: '/api/challenge/secret',
    desc: '反爬示例接口：要求请求头 X-Student-Id（任意非空值，示例 data221），否则返回 403 提示。',
    sample: `res = requests.get('https://crawler-lab.030516.xyz/api/challenge/secret',
        headers={'X-Student-Id': 'data221'})
print(res.json())   # 缺少请求头时会收到 {"code":403,...}`
  },
  {
    method: 'GET',
    path: '/api/health',
    desc: '健康检查，返回 {ok:true, ts}。',
    sample: `curl https://crawler-lab.030516.xyz/api/health`
  }
]

</script>

<template>
  <div class="lab-container docs-wrap">
    <div class="docs-head">
      <div>
        <h2>教学文档</h2>
        <p class="docs-sub">站点地图 · 教学账号 · API 契约 · 常见报错 · 合规说明。本文档同时是教师备课手册。</p>
      </div>
      <div class="health-box">
        <span class="lab-tag" :class="{ green: healthState === 'ok', amber: healthState === 'err' }"
              :aria-label="healthState === 'ok' ? '服务正常' : healthState === 'err' ? '服务异常' : '检测中'">
          {{ healthState === 'ok' ? '服务正常' : healthState === 'err' ? '服务异常' : '检测中' }}
        </span>
        <span class="health-text" :title="health" role="status">{{ health }}</span>
        <button class="lab-btn ghost small" :disabled="healthState === 'loading'" @click="checkHealth">刷新</button>
      </div>
    </div>

    <!-- 站点地图 -->
    <section class="lab-card docs-sec">
      <h3>1 · 站点地图</h3>
      <div class="table-scroll">
        <table class="lab-table">
          <thead><tr><th>路径</th><th>页面</th><th>说明</th></tr></thead>
          <tbody>
            <tr v-for="s in SITEMAP" :key="s.path">
              <td>
                <!-- 站内页面可点击直达；接口与占位路径（…）保持纯文本 -->
                <router-link v-if="!s.path.includes('.jpg') && !s.path.includes('…')" :to="s.path"><code>{{ s.path }}</code></router-link>
                <code v-else>{{ s.path }}</code>
              </td>
              <td><b>{{ s.name }}</b></td>
              <td>{{ s.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 教学账号 -->
    <section class="lab-card docs-sec">
      <h3>2 · 教学账号</h3>
      <div class="table-scroll">
        <table class="lab-table">
          <thead><tr><th>站点</th><th>用户名</th><th>密码</th><th>备注</th></tr></thead>
          <tbody>
            <tr v-for="a in ACCOUNTS" :key="a.site + a.user">
              <td>{{ a.site }}</td>
              <td><code>{{ a.user }}</code></td>
              <td><code>{{ a.pwd }}</code></td>
              <td>{{ a.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="lab-note warn">
        <span>notebook 原代码从 secret 模块导入真实账号（ryuser / bdpwd）。在模拟站请改用上述教学账号，
        否则会得到「用户名或密码错误」响应——这本身就是一次很好的接口行为观察。</span>
      </div>
    </section>

    <!-- API 契约 -->
    <section class="lab-card docs-sec">
      <h3>3 · API 契约</h3>
      <p class="sec-sub">所有响应均为 JSON（图片除外），字段风格仿常见 Java 站点：{code, msg, data}。</p>
      <div v-for="a in APIS" :key="a.path" class="api-item">
        <div class="api-head">
          <span class="lab-tag" :class="a.method === 'GET' ? 'blue' : 'green'">{{ a.method }}</span>
          <code class="api-path">{{ a.path }}</code>
        </div>
        <p class="api-desc">{{ a.desc }}</p>
        <pre class="lab-code api-sample">{{ a.sample }}</pre>
      </div>
    </section>

    <!-- 常见报错与教学案例 -->
    <section class="lab-card docs-sec">
      <h3>4 · 常见报错与教学案例</h3>
      <p class="sec-sub">这些「报错」都是精心设计的教学素材，碰到了先来这里对照，别急着改代码。</p>
      <div v-for="e in ERRORS" :key="e.name" class="err-item">
        <h4><code class="code-inline">{{ e.name }}</code> · {{ e.scene }}</h4>
        <p class="err-when"><b>现象：</b>{{ e.when }}</p>
        <p class="err-why"><b>原因：</b>{{ e.why }}</p>
        <p class="err-how"><b>正确写法：</b>{{ e.how }}</p>
      </div>
    </section>

    <!-- 合规说明 -->
    <section class="lab-card docs-sec">
      <h3>5 · 合规与教学说明</h3>
      <ul class="rule-list">
        <li>本实训站为<b>教学模拟环境</b>：页面结构参照公开站点的 DOM 契约重建，所有数据（图书、搜索结果、验证码）均为程序生成的虚构数据，与任何真实站点无数据关联。</li>
        <li>站点应部署在<b>内网或教学专用服务器</b>上，仅用于课程实训；请勿作为真实业务系统对外提供服务。</li>
        <li>课程中练习爬取真实站点时，请遵守目标站点的 robots 协议与服务条款，控制请求频率，不采集个人敏感信息。</li>
        <li>教学中建议把「合规爬取」作为默认要求：本站闯关第 6 关即是请求头校验的反爬示例。</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.docs-wrap { padding-top: 30px; padding-bottom: 50px; }
.docs-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 22px; flex-wrap: wrap; }
.docs-head h2 { font-size: 24px; }
.docs-sub { color: var(--lab-ink-3); font-size: 13.5px; margin: 6px 0 0; }
.health-box { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid var(--lab-line); padding: 8px 14px; border-radius: 10px; }
.health-text {
  font-size: 12.5px; color: var(--lab-ink-2);
  max-width: 340px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.docs-sec { padding: 22px; margin-bottom: 18px; }
.docs-sec h3 { font-size: 18px; margin: 0 0 14px; }
.docs-sec h4 { font-size: 14px; margin: 0 0 8px; }
.sec-sub { font-size: 13px; color: var(--lab-ink-3); margin: 0 0 14px; }
.table-scroll { overflow-x: auto; }

.err-item { margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px dashed var(--lab-line); }
.err-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.err-item h4 { margin: 0 0 6px; font-size: 14px; }
.err-item p { margin: 0 0 3px; font-size: 13px; color: var(--lab-ink-2); line-height: 1.7; word-break: break-word; }
.api-item { margin-bottom: 18px; }
.api-item:last-child { margin-bottom: 0; }
.api-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.api-path { font-family: var(--lab-mono); font-size: 13.5px; font-weight: 700; color: #0f172a; }
.api-desc { font-size: 13px; color: var(--lab-ink-2); margin: 0 0 8px; }
.api-sample { font-size: 12px; }

.rule-list { margin: 0; padding-left: 20px; font-size: 13.5px; color: var(--lab-ink-2); }
.rule-list li { margin-bottom: 8px; line-height: 1.75; }
</style>
