<script setup>
/**
 * 总领页面（/）
 * 课程导航中心：站点地图、notebook 单元格对照表、快速开始指引。
 */
import { onMounted } from 'vue'

// 首屏统计口径（与 DocsView 站点地图 / APIS 表保持一致，避免数字漂移）：
// 功能页面 12 个（含 /docs 自身），接口 8 个（kaptcha.jpg、login、baidu/login、
// captcha/new、captcha/verify、challenge/check、challenge/secret、health）
const SITES = [
  {
    key: 'baidu',
    name: '伪百度搜索',
    desc: '复刻百度首页与结果页的定位契约（#kw / #su / h3.t / #page 分页），并内置登录弹窗与 Cookie 登录态。',
    accent: '#4e6ef2',
    pages: [
      { path: '/baidu', label: '百度首页', code: 'driver.get(\'https://crawler-lab.030516.xyz/baidu\')' },
      { path: '/s?wd=%E8%BD%AC%E6%9C%AC&pn=0', label: '搜索结果页', code: '标题=“转本_百度搜索”，h3.t 结构' },
      { path: '/baidu', label: '登录弹窗', code: '#TANGRAM__PSP_11__userName / password / isAgree / submit' }
    ]
  },
  {
    key: 'ptpress',
    name: '伪人邮书城',
    desc: '复刻人民邮电出版社书城的搜索与登录流程，路径与 notebook 完全一致，仅需替换域名。',
    accent: '#e60012',
    pages: [
      { path: '/shopping/index', label: '书城首页', code: '/shopping/index（路径一致）' },
      { path: '/search?keyword=%E5%A4%A7%E6%95%B0%E6%8D%AE&jc=', label: '搜索结果页', code: '.book_item > a > p 抓书名' },
      { path: '/login', label: '会员登录', code: '#loginForm 三段式结构 + /kaptcha.jpg' }
    ]
  }
]

const TOOLS = [
  { path: '/playground', icon: '⌘', name: '选择器练习场', desc: '在线试写 CSS / XPath 选择器，实时高亮命中元素，notebook 关键选择器速查可一键试跑。' },
  { path: '/challenge', icon: '⚔', name: '爬虫闯关（6 关）', desc: '静态列表 → 异步加载 → 点击展开 → 分页表格 → 数据解码 → 请求头反爬，逐级通关。' },
  { path: '/captcha', icon: '🔑', name: '验证码识读练习', desc: '无限刷新验证码图片并即时校验，配合 notebook「识别验证码」环节练手。' },
  { path: '/docs', icon: '📖', name: '教学文档', desc: '页面地图、API 契约、教学账号、常见报错与合规说明，教师备课与学生自学通用。' }
]

const CELLS = [
  {
    cell: '单元格 0',
    topic: '百度搜索与翻页爬取',
    original: 'https://www.baidu.com/',
    replace: 'https://crawler-lab.030516.xyz/baidu',
    selector: '#kw、#su、h3.t、#page > div 内 a[last()]',
    task: '定位搜索框输入「转本」，点击搜索，等待标题出现后循环抓取 h3.t 文本并点击下一页'
  },
  {
    cell: '单元格 2',
    topic: '人邮书城图书搜索',
    original: 'https://www.ptpress.com.cn/shopping/index',
    replace: 'https://crawler-lab.030516.xyz/shopping/index（仅换域名）',
    selector: '//*[@id="header"]/div[1]/div/div[2]/div[3]/input 与 button',
    task: '输入「大数据」→ 搜索 → 切换新窗口 → BeautifulSoup 抓取 .book_item > a > p 书名'
  },
  {
    cell: '单元格 4/5',
    topic: '识别验证码',
    original: 'https://www.ptpress.com.cn/kaptcha.jpg',
    replace: 'https://crawler-lab.030516.xyz/kaptcha.jpg（仅换域名）',
    selector: 'requests 下载 + plt.imread 展示 + input 人工识读',
    task: '下载验证码图片，matplotlib 显示后人工输入；本站验证码为 4 位数字 PNG'
  },
  {
    cell: '单元格 8',
    topic: '模拟登录（提交表单）',
    original: 'POST https://www.ptpress.com.cn/login',
    replace: 'POST https://crawler-lab.030516.xyz/login（仅换域名）',
    selector: 'sess.post(url, data={username, password, verifyCode})',
    task: '用 requests.Session 保持验证码会话并提交登录，观察返回 JSON 与 Set-Cookie'
  },
  {
    cell: '单元格 10',
    topic: 'Selenium 自动化提交表单',
    original: 'https://www.ptpress.com.cn/login',
    replace: 'https://crawler-lab.030516.xyz/login（仅换域名）',
    selector: '#loginForm/div[1]/input、div[2]/input、div[3]/div[1]/div/input、.verCodeImg、#loginBtn',
    task: '自动填写用户名密码 → 截取验证码元素 → 人工输入 → 点击登录'
  },
  {
    cell: '单元格 12',
    topic: '百度自动化登录表单',
    original: 'https://www.baidu.com/',
    replace: 'https://crawler-lab.030516.xyz/baidu',
    selector: '#s-top-loginbtn、#TANGRAM__PSP_11__userName / password / isAgree / submit',
    task: '点击登录 → 填写账号（student/123456）→ 勾选协议 → 提交，观察 BDUSS Cookie'
  },
  {
    cell: '单元格 14',
    topic: '百度 Cookies 登录',
    original: 'https://www.baidu.com/',
    replace: 'https://crawler-lab.030516.xyz/baidu',
    selector: 'driver.add_cookie({name:"BAIDUID"...})、{name:"BDUSS"...}',
    task: '未登录打开首页 → 注入两个 Cookie → 刷新后右上角显示登录态'
  }
]

onMounted(() => {
  document.title = 'Data221 · 爬虫教学实训站'
})
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="hero">
      <div class="lab-container hero-inner">
        <div class="hero-text">
          <p class="hero-kicker">Data221 · 课程配套实训环境</p>
          <h1 class="hero-title">Selenium 自动化爬取<br>教学实训站</h1>
          <p class="hero-desc">
            原 notebook 练习页面（百度 / 人民邮电出版社）已失效？本站按原代码的
            <b>定位契约</b>重新构建了全部目标页面：选择器、URL、窗口行为与
            Session 验证码流程均可直接复用，只需把 notebook 中的域名替换为本站地址。
          </p>
          <div class="hero-actions">
            <router-link class="lab-btn" to="/docs">查看部署与使用文档</router-link>
            <router-link class="lab-btn ghost" to="/playground">先练选择器</router-link>
          </div>
          <div class="hero-stats">
            <div class="stat"><b>12</b><span>功能页面</span></div>
            <div class="stat"><b>8</b><span>后端接口</span></div>
            <div class="stat"><b>6</b><span>闯关关卡</span></div>
            <div class="stat"><b>0</b><span>外部依赖</span></div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="code-window">
            <div class="code-title-bar"><span></span><span></span><span></span><em>demo.py</em></div>
            <pre class="hero-code"><span class="c1"># notebook 单元格 0 · 只改了这一行</span>
<span class="k">from</span> selenium <span class="k">import</span> webdriver
<span class="k">from</span> selenium.webdriver.common.by <span class="k">import</span> By

driver = webdriver.Chrome()
<span class="c1"># 原来是 https://www.baidu.com/</span>
driver.get(<span class="s">'https://crawler-lab.030516.xyz/baidu'</span>)

driver.find_element(By.XPATH,
    <span class="s">'//*[@id="kw"]'</span>).send_keys(<span class="s">'转本'</span>)
driver.find_element(By.XPATH,
    <span class="s">'//*[@id="su"]'</span>).click()
<span class="c1"># 其余代码一行不用改 ✓</span></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- 快速开始 -->
    <section class="lab-section">
      <div class="lab-container">
        <div class="lab-section-head">
          <h2>快速开始</h2>
          <span class="sub">三步恢复全部 notebook 实验</span>
        </div>
        <div class="lab-grid cols-3">
          <div class="lab-card step-card">
            <span class="step-no">1</span>
            <h3>替换 URL</h3>
            <p>把 notebook 中 <code class="code-inline">https://www.baidu.com/</code> 换成
              <code class="code-inline">https://crawler-lab.030516.xyz/baidu</code>；人邮相关仅替换域名为
              <code class="code-inline">https://crawler-lab.030516.xyz</code>，路径保持不变。</p>
            <p class="step-note"><b>SERVER</b> 是占位符 = 本站部署地址：本地运行为
              <code class="code-inline">localhost</code>，教室环境以老师公告的 IP/域名为准。</p>
          </div>
          <div class="lab-card step-card">
            <span class="step-no">2</span>
            <h3>打开对应页面</h3>
            <p>人邮实验直接访问 <router-link to="/shopping/index">/shopping/index</router-link>、
              <router-link to="/login">/login</router-link>；百度实验从
              <router-link to="/baidu">/baidu</router-link> 开始。教学账号 <b>student / 123456</b>。</p>
          </div>
          <div class="lab-card step-card">
            <span class="step-no">3</span>
            <h3>跑通原代码</h3>
            <p>选择器、窗口切换、验证码 Session、Cookie 注入等流程与本站一一对应，
              原代码逻辑无需修改即可运行。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 两大模拟站点 -->
    <section class="lab-section">
      <div class="lab-container">
        <div class="lab-section-head">
          <h2>两大模拟目标站点</h2>
          <span class="sub">对应 notebook 全部实战环节</span>
        </div>
        <div class="lab-grid cols-2">
          <div v-for="s in SITES" :key="s.key" class="lab-card site-card">
            <div class="site-head" :style="{ '--accent': s.accent }">
              <h3>{{ s.name }}</h3>
              <span class="lab-tag" :style="{ color: s.accent, borderColor: s.accent }">复刻</span>
            </div>
            <p class="site-desc">{{ s.desc }}</p>
            <ul class="site-pages">
              <!-- key 用 path+label：同一站点下不同条目可能同 path（如 /baidu 首页与登录弹窗） -->
              <li v-for="p in s.pages" :key="p.path + '|' + p.label">
                <router-link :to="p.path">{{ p.label }}</router-link>
                <code>{{ p.code }}</code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- 实训工具 -->
    <section class="lab-section">
      <div class="lab-container">
        <div class="lab-section-head">
          <h2>课堂延伸 · 实训工具</h2>
          <span class="sub">notebook 之外新增的能力</span>
        </div>
        <div class="lab-grid cols-4">
          <router-link v-for="t in TOOLS" :key="t.path" class="lab-card tool-card" :to="t.path">
            <span class="tool-icon">{{ t.icon }}</span>
            <h3>{{ t.name }}</h3>
            <p>{{ t.desc }}</p>
          </router-link>
        </div>
      </div>
    </section>

    <!-- notebook 对照表 -->
    <section class="lab-section">
      <div class="lab-container">
        <div class="lab-section-head">
          <h2>notebook 单元格 ↔ 本站页面对照表</h2>
          <span class="sub">备课时可直接按行核对</span>
        </div>
        <div class="lab-card table-wrap">
          <table class="lab-table">
            <thead>
              <tr>
                <th>notebook</th>
                <th>环节</th>
                <th>原 URL</th>
                <th>替换为</th>
                <th>关键选择器 / 契约</th>
                <th>实训任务</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in CELLS" :key="c.cell">
                <td><span class="lab-tag blue mono">{{ c.cell }}</span></td>
                <td><b>{{ c.topic }}</b></td>
                <td><code>{{ c.original }}</code></td>
                <td><code>{{ c.replace }}</code></td>
                <td><code>{{ c.selector }}</code></td>
                <td>{{ c.task }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hero */
.hero {
  background:
    radial-gradient(1200px 500px at 85% -10%, rgba(79, 70, 229, 0.16), transparent 60%),
    radial-gradient(900px 420px at 5% 10%, rgba(37, 99, 235, 0.12), transparent 55%),
    #f5f7fb;
  border-bottom: 1px solid var(--lab-line);
}
.hero-inner {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 40px;
  padding-top: 56px;
  padding-bottom: 56px;
  align-items: center;
}
@media (max-width: 900px) { .hero-inner { grid-template-columns: 1fr; } }
.hero-kicker {
  color: var(--lab-indigo);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 1px;
  margin: 0 0 10px;
}
.hero-title {
  font-size: 38px;
  line-height: 1.22;
  margin: 0 0 16px;
  letter-spacing: -0.5px;
}
.hero-desc { color: var(--lab-ink-2); max-width: 560px; margin: 0 0 22px; }
.hero-actions { display: flex; gap: 12px; margin-bottom: 26px; flex-wrap: wrap; }
.hero-stats { display: flex; gap: 26px; flex-wrap: wrap; }
.hero-stats .stat { display: flex; flex-direction: column; }
.hero-stats b { font-size: 24px; color: var(--lab-blue); }
.hero-stats span { font-size: 12px; color: var(--lab-ink-3); }

/* 代码窗 */
.code-window {
  background: #0f172a;
  border-radius: 14px;
  box-shadow: 0 24px 60px -20px rgba(15, 23, 42, 0.45);
  overflow: hidden;
  transform: rotate(-0.4deg);
}
.code-title-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 16px;
  background: #1e293b;
}
.code-title-bar span { width: 11px; height: 11px; border-radius: 999px; background: #f87171; }
.code-title-bar span:nth-child(2) { background: #fbbf24; }
.code-title-bar span:nth-child(3) { background: #34d399; }
.code-title-bar em {
  margin-left: auto;
  font-style: normal;
  color: #94a3b8;
  font-size: 12px;
  font-family: var(--lab-mono);
}
.hero-code {
  margin: 0;
  padding: 18px 20px;
  color: #e2e8f0;
  font-family: var(--lab-mono);
  font-size: 12.5px;
  line-height: 1.75;
  overflow-x: auto;
}
.hero-code .k { color: #93c5fd; }
.hero-code .s { color: #9ae6b4; }
.hero-code .c1 { color: #7c88a1; }

/* 快速开始 */
.step-card { padding: 22px; position: relative; }
.step-no {
  display: inline-flex;
  width: 30px; height: 30px;
  align-items: center; justify-content: center;
  background: var(--lab-blue);
  color: #fff;
  border-radius: 9px;
  font-weight: 700;
  margin-bottom: 12px;
}
.step-card h3 { font-size: 16px; margin-bottom: 8px; }
.step-card p { color: var(--lab-ink-2); font-size: 13.5px; margin: 0 0 6px; }
.step-note { font-size: 12.5px; color: #5f6b7a; background: #f8fafc; border-left: 3px solid var(--lab-blue); padding: 6px 10px; border-radius: 0 6px 6px 0; }

/* 站点卡 */
.site-card { padding: 22px; }
.site-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.site-head h3 { font-size: 18px; }
.site-desc { color: var(--lab-ink-2); font-size: 13.5px; }
.site-pages { list-style: none; padding: 0; margin: 14px 0 0; display: flex; flex-direction: column; gap: 10px; }
.site-pages li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  background: #f8fafc;
  border: 1px solid var(--lab-line);
  border-radius: 9px;
  flex-wrap: wrap;
}
.site-pages a { font-weight: 600; font-size: 13.5px; }
.site-pages code {
  font-family: var(--lab-mono);
  font-size: 11.5px;
  color: var(--lab-ink-3);
  background: #eef2f7;
  border-radius: 5px;
  padding: 2px 8px;
  word-break: break-all;
}

/* 工具卡 */
.tool-card { padding: 20px; text-decoration: none; color: inherit; transition: transform .15s, box-shadow .15s; }
.tool-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px -12px rgba(15,23,42,.2); text-decoration: none; }
.tool-icon { font-size: 22px; color: var(--lab-indigo); }
.tool-card h3 { font-size: 15.5px; margin: 10px 0 6px; }
.tool-card p { font-size: 12.8px; color: var(--lab-ink-3); margin: 0; }

/* 表格 */
.table-wrap { padding: 8px; overflow-x: auto; }
.table-wrap .lab-table { border: none; }
.table-wrap .lab-table th, .table-wrap .lab-table td { font-size: 12.5px; }
</style>
