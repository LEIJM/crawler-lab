<script setup>
/**
 * 教学文档（/docs）
 * 面向教师备课与学生自学：站点地图、API 契约、账号、部署指南与合规说明。
 */
import { onMounted, ref } from 'vue'

const health = ref('检测中…')
async function checkHealth() {
  try {
    const res = await fetch('/api/health')
    const data = await res.json()
    health.value = data.ok ? `服务正常 · ${new Date(data.ts).toLocaleString()}` : '异常'
  } catch {
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

const APIS = [
  {
    method: 'GET',
    path: '/kaptcha.jpg',
    desc: '图形验证码。无 cid 参数时绑定 Session：响应携带 Set-Cookie: RYSESSID，10 分钟有效；带 ?cid=xxx 时返回该挑战的图片。',
    sample: `# 对应 notebook 单元格 4
img = requests.get('http://SERVER:8188/kaptcha.jpg')
with open('./kaptcha.jpg', 'wb') as f:
    f.write(img.content)`
  },
  {
    method: 'POST',
    path: '/login',
    desc: '书城登录。表单字段 username / password / verifyCode；验证码取自当前 Session（RYSESSID），失败提示验证码失效/错误。',
    sample: `# 对应 notebook 单元格 8
sess = requests.Session()
sess.get('http://SERVER:8188/kaptcha.jpg')   # 1. 先取验证码（种下 RYSESSID）
code = input('请输入验证码：')                # 2. 人工识读
res = sess.post('http://SERVER:8188/login', data={
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
    sample: `r = requests.post('http://SERVER:8188/api/captcha/new').json()
print(r['data']['cid'], r['data']['url'])`
  },
  {
    method: 'POST',
    path: '/api/captcha/verify',
    desc: '验证码练习：校验答案。JSON 字段 cid / code，返回 {data:{pass:true|false}}。',
    sample: `res = requests.post('http://SERVER:8188/api/captcha/verify',
        json={'cid': cid, 'code': code}).json()
print(res['data']['pass'])`
  },
  {
    method: 'POST',
    path: '/api/challenge/check',
    desc: '闯关答案校验。JSON 字段 level(1-6) / answer。答案仅存于服务端。',
    sample: `res = requests.post('http://SERVER:8188/api/challenge/check',
        json={'level': 1, 'answer': 'CT-XXXX'}).json()
print(res['data']['pass'])`
  },
  {
    method: 'GET',
    path: '/api/challenge/secret',
    desc: '反爬示例接口：要求请求头 X-Student-Id（任意非空值，示例 data221），否则返回 403 提示。',
    sample: `res = requests.get('http://SERVER:8188/api/challenge/secret',
        headers={'X-Student-Id': 'data221'})
print(res.json())   # 缺少请求头时会收到 {"code":403,...}`
  },
  {
    method: 'GET',
    path: '/api/health',
    desc: '健康检查，返回 {ok:true, ts}。',
    sample: `curl http://SERVER:8188/api/health`
  }
]

const DEPLOY = `# 1) 安装依赖（首次）
npm install

# 2) 构建前端产物到 dist/
npm run build

# 3) 启动零依赖服务器（默认端口 8188，可用 PORT 覆盖）
npm run serve
# 或：node server/server.js / PORT=80 node server/server.js

# 验证
#   浏览器打开 http://localhost:8188          → 总领页
#   curl http://localhost:8188/kaptcha.jpg -o k.jpg  → 验证码图片
#   curl -X POST http://localhost:8188/api/health 之类接口可用`

const DEPLOY_OFFLINE = `# 内网服务器无法 npm install 时：
# 1. 在任意联网机器上完成 npm install && npm run build
# 2. 仅需拷贝 dist/ 与 server/ 两个目录到内网服务器（服务器零外部依赖）
# 3. 内网机器执行：
node server/server.js --selftest   # 先自检（11 项）
PORT=80 node server/server.js      # 再启动

# 后台常驻（Linux）：
PORT=80 nohup node server/server.js > lab.log 2>&1 &`

const DEPLOY_DEV = `# 开发模式（单命令，验证码/登录/闯关接口已内置到 Vite 开发服务器）：
npm run dev        # 打开 http://localhost:5173 即可完整使用，无需另开后端

# 生产模式（正式部署用）：
npm run build      # 构建 dist/
npm run serve      # node server/server.js，默认 8188 端口`

const DEPLOY_CF = `# 首次：npx wrangler login

# Workers（推荐，静态资源 + 接口一体）
npm run deploy
# 等价：npm run build && wrangler deploy

# Pages（dist 静态托管 + functions/ 接口）
npm run deploy:pages
# 控制台 Git 集成：构建命令 npm run build，输出目录 dist
# （Pages 项目请使用 wrangler.pages.jsonc，勿与 Workers 的 main 配置混用）

# 可选：CAPTCHA_SECRET 覆盖验证码令牌密钥（Workers/Pages 环境变量）`
</script>

<template>
  <div class="lab-container docs-wrap">
    <div class="docs-head">
      <div>
        <h2>教学文档</h2>
        <p class="docs-sub">站点地图 · 教学账号 · API 契约 · 部署指南 · 合规说明。本文档同时是教师备课手册。</p>
      </div>
      <div class="health-box">
        <span class="lab-tag" :class="health.startsWith('服务正常') ? 'green' : 'amber'">服务状态</span>
        <span class="health-text">{{ health }}</span>
        <button class="lab-btn ghost small" @click="checkHealth">刷新</button>
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
              <td><code>{{ s.path }}</code></td>
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

    <!-- 部署指南 -->
    <section class="lab-card docs-sec">
      <h3>4 · 部署指南</h3>
      <div class="deploy-grid">
        <div>
          <h4>标准部署</h4>
          <pre class="lab-code">{{ DEPLOY }}</pre>
        </div>
        <div>
          <h4>内网离线部署</h4>
          <pre class="lab-code">{{ DEPLOY_OFFLINE }}</pre>
        </div>
        <div>
          <h4>开发模式（可省）</h4>
          <pre class="lab-code">{{ DEPLOY_DEV }}</pre>
        </div>
        <div>
          <h4>Cloudflare Workers / Pages</h4>
          <pre class="lab-code">{{ DEPLOY_CF }}</pre>
        </div>
      </div>
      <div class="lab-note info">
        <span>自建部署要求 Node ≥ 18；服务器仅使用 Node 内置模块，<b>无需在部署机执行 npm install</b>。
          构建产物位于 dist/。托管到 Cloudflare 时执行 <code>npm run deploy</code>（Workers）或
          <code>npm run deploy:pages</code>（Pages），接口与 Node 版契约一致。</span>
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
.health-text { font-size: 12.5px; color: var(--lab-ink-2); }

.docs-sec { padding: 22px; margin-bottom: 18px; }
.docs-sec h3 { font-size: 18px; margin: 0 0 14px; }
.docs-sec h4 { font-size: 14px; margin: 0 0 8px; }
.sec-sub { font-size: 13px; color: var(--lab-ink-3); margin: 0 0 14px; }
.table-scroll { overflow-x: auto; }

.api-item { margin-bottom: 18px; }
.api-item:last-child { margin-bottom: 0; }
.api-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.api-path { font-family: var(--lab-mono); font-size: 13.5px; font-weight: 700; color: #0f172a; }
.api-desc { font-size: 13px; color: var(--lab-ink-2); margin: 0 0 8px; }
.api-sample { font-size: 12px; }

.deploy-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; }

.rule-list { margin: 0; padding-left: 20px; font-size: 13.5px; color: var(--lab-ink-2); }
.rule-list li { margin-bottom: 8px; line-height: 1.75; }
</style>
