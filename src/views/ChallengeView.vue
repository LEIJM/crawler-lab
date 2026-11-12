<script setup>
/**
 * 爬虫闯关（/challenge）
 * 六个递进关卡，覆盖静态解析 → 等待 → 交互 → 分页 → 解码 → 请求头反爬。
 * 每关藏有一个「关卡暗号」，提交到 /api/challenge/check 由服务端校验
 * （答案不写在前端代码里，避免查看源码直接通关）。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

/* ---------- 通用状态 ---------- */
const answers = ref(['', '', '', '', '', ''])
// 通关状态持久化到 localStorage（答案仍在服务端校验，本地仅存 pass 标记），
// 学生刷新/断点续练不丢进度
const passed = ref([false, false, false, false, false, false])
try {
  const saved = JSON.parse(localStorage.getItem('challenge-passed') || '[]')
  if (Array.isArray(saved) && saved.length === 6) {
    passed.value = saved.map((v) => !!v)
  }
} catch { /* 存储不可用时保持默认 */ }
const checking = ref(-1)

async function submitLevel(level) {
  checking.value = level
  try {
    const res = await fetch('/api/challenge/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, answer: answers.value[level - 1] })
    })
    const data = await res.json()
    if (data.data?.pass) {
      passed.value[level - 1] = true
      try {
        localStorage.setItem('challenge-passed', JSON.stringify(passed.value))
      } catch { /* 隐私模式等存储不可用时静默降级为会话内状态 */ }
    }
  } finally {
    checking.value = -1
  }
}

/* ---------- 第 1 关：静态列表 ---------- */
const MOVIES = [
  { rank: 1, title: '星际漫游 2049', year: 2049, tag: '科幻' },
  { rank: 2, title: '数据之城', year: 2024, tag: '剧情' },
  { rank: 3, title: '爬虫纪元', year: 2025, tag: '悬疑' },
  { rank: 4, title: '算法风暴', year: 2026, tag: '动作' },
  { rank: 5, title: '像素江湖', year: 2023, tag: '动画' },
  { rank: 6, title: '云端救援', year: 2027, tag: '灾难' },
  { rank: 7, title: '量子折叠', year: 2030, tag: '烧脑' },
  { rank: 8, title: '终端之上', year: 2025, tag: '纪录片' },
  { rank: 9, title: '验证码之战', year: 2026, tag: '喜剧' },
  { rank: 10, title: '最后的会话', year: 2028, tag: '暗号：CT-7749' }
]

/* ---------- 第 2 关：异步加载 ---------- */
const newsState = ref('loading')
const HOT_NEWS = [
  { id: 1, title: '国家数据局发布数据要素×行动计划', date: '2026-11-05' },
  { id: 2, title: '全国职业院校技能大赛大数据赛项规程更新', date: '2026-11-03' },
  { id: 3, title: '教育部新增人工智能技术应用专业目录', date: '2026-11-01' },
  { id: 4, title: '本期实训通关暗号：CT-2026-NEWS', date: '2026-10-30' },
  { id: 5, title: '工信部发布算力基础设施发展白皮书', date: '2026-10-28' }
]
let newsTimer = null
onMounted(() => {
  newsTimer = setTimeout(() => { newsState.value = 'loaded' }, 2500)
})
onUnmounted(() => clearTimeout(newsTimer))

/* ---------- 第 3 关：点击展开 ---------- */
const openFaq = ref(-1)
const FAQS = [
  { q: '什么是 robots.txt？', a: 'robots.txt 是网站告知爬虫哪些目录允许/禁止抓取的约定文件，遵守它是爬虫礼仪的第一步。' },
  { q: '显式等待和隐式等待的区别？', a: '隐式等待作用于全局所有定位；显式等待（WebDriverWait + expected_conditions）只针对特定条件，更精准高效。' },
  { q: '为什么 page_source 会抓不到内容？', a: '内容通常由 JS 异步渲染，需等待元素出现后再取 page_source；本关正是这一问题的演练场。' },
  { q: '如何翻页采集完整数据？', a: '定位下一页元素循环点击，或直接构造带分页参数的 URL 批量请求。答案暗号：CT-FAQ-3355。' },
  { q: '遇到验证码怎么办？', a: '教学环境允许人工识读输入，生产环境请接入合法的打码或行为验证方案，并遵守目标站点条款。' }
]

/* ---------- 第 4 关：分页表格 ---------- */
const salePage = ref(1)
const SALES = computed(() => {
  const out = []
  const regions = ['华东', '华南', '华北', '西南', '东北']
  for (let i = 1; i <= 40; i++) {
    const page = Math.ceil(i / 8)
    const row = i % 8 || 8
    out.push({
      page, row,
      month: `${2026}-${String(((i * 5) % 12) + 1).padStart(2, '0')}`,
      region: regions[i % regions.length],
      amount: 100 + ((i * 37) % 900),
      note: (page === 5 && row === 8) ? '暗号：CT-SALE-9198' : '—'
    })
  }
  return out
})
const saleRows = computed(() => SALES.value.filter(r => r.page === salePage.value))

/* ---------- 第 5 关：编码谜题 ---------- */
// btoa 仅支持 Latin1，这里编码纯 ASCII 串；乱码观感由 base64 本身提供
const B64_FLAG = computed(() => btoa('CT-BASE-6420'))
const REVERSED_FLAG = computed(() => 'CT-BASE-6420'.split('').reverse().join(''))

/* ---------- 第 6 关：请求头 ---------- */
const secretResp = ref('')
const secretLoading = ref(false)
async function loadSecret(fromPage) {
  secretLoading.value = true
  try {
    const res = await fetch('/api/challenge/secret', {
      headers: { 'X-Student-Id': 'data221' }
    })
    secretResp.value = JSON.stringify(await res.json(), null, 2)
    void fromPage
  } finally {
    secretLoading.value = false
  }
}

const passCount = computed(() => passed.value.filter(Boolean).length)
const LEVELS = [
  { title: '静态列表解析', tag: '基础', points: 'find_elements / querySelectorall / 文本提取' },
  { title: '异步加载等待', tag: '等待', points: 'time.sleep 与 WebDriverWait 的取舍' },
  { title: '点击展开内容', tag: '交互', points: 'click() 之后再提取隐藏内容' },
  { title: '分页数据表', tag: '翻页', points: '循环点击下一页汇总全部数据' },
  { title: '编码数据解码', tag: '解码', points: 'base64 / 字符串反转等数据后处理' },
  { title: '请求头反爬', tag: '反爬', points: 'headers 携带身份标识绕过校验' }
]
</script>

<template>
  <div class="lab-container ch-wrap">
    <div class="ch-head">
      <div>
        <h2>爬虫闯关 · 六关</h2>
        <p class="ch-sub">每一关的页面里藏着一个「关卡暗号」（形如 CT-xxxx），用你的爬虫把它挖出来并提交。</p>
      </div>
      <div class="ch-progress">
        <b>{{ passCount }}</b><span>/ 6 已通关</span>
        <div class="ch-bar"><div class="ch-bar-in" :style="{ width: (passCount / 6) * 100 + '%' }"></div></div>
      </div>
    </div>

    <!-- ===== 第 1 关 ===== -->
    <section class="lab-card ch-level" :class="{ done: passed[0] }">
      <header class="lv-head">
        <span class="lv-no">第 1 关</span>
        <h3>{{ LEVELS[0].title }}</h3>
        <span class="lab-tag blue">{{ LEVELS[0].tag }}</span>
        <span class="lv-points">考点：{{ LEVELS[0].points }}</span>
        <span v-if="passed[0]" class="lab-tag green">已通关 ✓</span>
      </header>
      <p class="lv-task">下面是一份静态电影榜单，请爬取全部影片信息，并找到排在<strong>最后一名</strong>影片的"分类标签"中隐藏的暗号。</p>
      <div class="lv-body">
        <ul id="movie-list">
          <li v-for="m in MOVIES" :key="m.rank">
            <span class="m-rank">{{ m.rank }}</span>
            <span class="m-title">{{ m.title }}</span>
            <span class="m-year">（{{ m.year }}）</span>
            <span class="m-tag">{{ m.tag }}</span>
          </li>
        </ul>
      </div>
      <div class="lv-check">
        <input v-model="answers[0]" placeholder="输入第 1 关暗号，如 CT-XXXX" @keydown.enter="submitLevel(1)">
        <button class="lab-btn small" :disabled="checking === 1 || passed[0]" @click="submitLevel(1)">
          {{ passed[0] ? '通过' : '提交' }}
        </button>
      </div>
    </section>

    <!-- ===== 第 2 关 ===== -->
    <section class="lab-card ch-level" :class="{ done: passed[1] }">
      <header class="lv-head">
        <span class="lv-no">第 2 关</span>
        <h3>{{ LEVELS[1].title }}</h3>
        <span class="lab-tag amber">{{ LEVELS[1].tag }}</span>
        <span class="lv-points">考点：{{ LEVELS[1].points }}</span>
        <span v-if="passed[1]" class="lab-tag green">已通关 ✓</span>
      </header>
      <p class="lv-task">打开本页 2.5 秒后，下方新闻才会异步渲染。用 <code class="code-inline">time.sleep</code> 或
        <code class="code-inline">WebDriverWait</code> 等待后抓取，找到含"通关暗号"的那条新闻。</p>
      <div class="lv-body">
        <div id="hot-news">
          <p v-if="newsState === 'loading'" class="loading-line">正在加载热点新闻…（2.5s 后出现）</p>
          <ul v-else class="news-list">
            <li v-for="n in HOT_NEWS" :key="n.id" class="news-item">
              <span class="news-date">{{ n.date }}</span>
              <span>{{ n.title }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="lv-check">
        <input v-model="answers[1]" placeholder="输入第 2 关暗号" @keydown.enter="submitLevel(2)">
        <button class="lab-btn small" :disabled="checking === 2 || passed[1]" @click="submitLevel(2)">
          {{ passed[1] ? '通过' : '提交' }}
        </button>
      </div>
    </section>

    <!-- ===== 第 3 关 ===== -->
    <section class="lab-card ch-level" :class="{ done: passed[2] }">
      <header class="lv-head">
        <span class="lv-no">第 3 关</span>
        <h3>{{ LEVELS[2].title }}</h3>
        <span class="lab-tag blue">{{ LEVELS[2].tag }}</span>
        <span class="lv-points">考点：{{ LEVELS[2].points }}</span>
        <span v-if="passed[2]" class="lab-tag green">已通关 ✓</span>
      </header>
      <p class="lv-task">问题答案默认隐藏，需要先点击问题展开。第 4 个 FAQ 的答案中藏着暗号。</p>
      <div class="lv-body">
        <div class="faq-item" v-for="(f, i) in FAQS" :key="i" :class="{ open: openFaq === i }">
          <p class="faq-q" @click="openFaq = openFaq === i ? -1 : i">
            <span class="faq-mark">{{ openFaq === i ? '−' : '+' }}</span>{{ f.q }}
          </p>
          <p v-show="openFaq === i" class="faq-a">{{ f.a }}</p>
        </div>
      </div>
      <div class="lv-check">
        <input v-model="answers[2]" placeholder="输入第 3 关暗号" @keydown.enter="submitLevel(3)">
        <button class="lab-btn small" :disabled="checking === 3 || passed[2]" @click="submitLevel(3)">
          {{ passed[2] ? '通过' : '提交' }}
        </button>
      </div>
    </section>

    <!-- ===== 第 4 关 ===== -->
    <section class="lab-card ch-level" :class="{ done: passed[3] }">
      <header class="lv-head">
        <span class="lv-no">第 4 关</span>
        <h3>{{ LEVELS[3].title }}</h3>
        <span class="lab-tag amber">{{ LEVELS[3].tag }}</span>
        <span class="lv-points">考点：{{ LEVELS[3].points }}</span>
        <span v-if="passed[3]" class="lab-tag green">已通关 ✓</span>
      </header>
      <p class="lv-task">销售数据分 5 页展示，请把 5 页数据全部爬下来，找到 <strong>第 5 页最后一行</strong>"备注"中的暗号。</p>
      <div class="lv-body">
        <table id="sales-table">
          <thead><tr><th>序号</th><th>月份</th><th>区域</th><th>销售额(万)</th><th>备注</th></tr></thead>
          <tbody>
            <tr v-for="r in saleRows" :key="r.page + '-' + r.row">
              <td>{{ (r.page - 1) * 8 + r.row }}</td><td>{{ r.month }}</td><td>{{ r.region }}</td><td>{{ r.amount }}</td><td>{{ r.note }}</td>
            </tr>
          </tbody>
        </table>
        <div class="pager">
          <button v-for="p in 5" :key="p" class="pager-btn" :class="{ cur: salePage === p }" @click="salePage = p">{{ p }}</button>
        </div>
      </div>
      <div class="lv-check">
        <input v-model="answers[3]" placeholder="输入第 4 关暗号" @keydown.enter="submitLevel(4)">
        <button class="lab-btn small" :disabled="checking === 4 || passed[3]" @click="submitLevel(4)">
          {{ passed[3] ? '通过' : '提交' }}
        </button>
      </div>
    </section>

    <!-- ===== 第 5 关 ===== -->
    <section class="lab-card ch-level" :class="{ done: passed[4] }">
      <header class="lv-head">
        <span class="lv-no">第 5 关</span>
        <h3>{{ LEVELS[4].title }}</h3>
        <span class="lab-tag blue">{{ LEVELS[4].tag }}</span>
        <span class="lv-points">考点：{{ LEVELS[4].points }}</span>
        <span v-if="passed[4]" class="lab-tag green">已通关 ✓</span>
      </header>
      <p class="lv-task">爬取的数据有时会被"包装"。下方面板中的两段乱码各藏着一个暗号（解码后是同一串字符），
        试着用 Python 的 <code class="code-inline">base64</code> 模块或字符串切片处理。</p>
      <div class="lv-body">
        <div id="secret-panel">
          <p class="secret-line"><b>片段一（Base64）：</b><code>{{ B64_FLAG }}</code></p>
          <p class="secret-line"><b>片段二（倒序）：</b><code>{{ REVERSED_FLAG }}</code></p>
        </div>
      </div>
      <div class="lv-check">
        <input v-model="answers[4]" placeholder="输入第 5 关暗号" @keydown.enter="submitLevel(5)">
        <button class="lab-btn small" :disabled="checking === 5 || passed[4]" @click="submitLevel(5)">
          {{ passed[4] ? '通过' : '提交' }}
        </button>
      </div>
    </section>

    <!-- ===== 第 6 关 ===== -->
    <section class="lab-card ch-level" :class="{ done: passed[5] }">
      <header class="lv-head">
        <span class="lv-no">第 6 关</span>
        <h3>{{ LEVELS[5].title }}</h3>
        <span class="lab-tag red">{{ LEVELS[5].tag }}</span>
        <span class="lv-points">考点：{{ LEVELS[5].points }}</span>
        <span v-if="passed[5]" class="lab-tag green">已通关 ✓</span>
      </header>
      <p class="lv-task">接口 <code class="code-inline">GET /api/challenge/secret</code> 会校验请求头
        <code class="code-inline">X-Student-Id</code>。不带请求头会被 403 拒绝，带上则返回暗号。
        点击下方按钮观察页面行为，再分别用 <b>带 / 不带</b> 请求头的 requests 复现这两种响应。</p>
      <div class="lv-body">
        <button class="lab-btn ghost" :disabled="secretLoading" @click="loadSecret(true)">
          {{ secretLoading ? '请求中…' : '用页面身份请求接口' }}
        </button>
        <pre v-if="secretResp" class="lab-code lv-code">{{ secretResp }}</pre>
        <pre v-else class="lab-code lv-code">提示：requests.get(url, headers={'X-Student-Id': 'data221'})</pre>
      </div>
      <div class="lv-check">
        <input v-model="answers[5]" placeholder="输入第 6 关暗号" @keydown.enter="submitLevel(6)">
        <button class="lab-btn small" :disabled="checking === 6 || passed[5]" @click="submitLevel(6)">
          {{ passed[5] ? '通过' : '提交' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ch-wrap { padding-top: 30px; padding-bottom: 50px; }
.ch-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 22px; flex-wrap: wrap; }
.ch-head h2 { font-size: 24px; }
.ch-sub { color: var(--lab-ink-3); font-size: 13.5px; margin: 6px 0 0; }
.ch-progress { text-align: right; min-width: 180px; }
.ch-progress b { font-size: 26px; color: var(--lab-green); }
.ch-progress span { color: var(--lab-ink-3); font-size: 12.5px; margin-left: 4px; }
.ch-bar { height: 8px; background: #e2e8f0; border-radius: 99px; margin-top: 8px; overflow: hidden; }
.ch-bar-in { height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); border-radius: 99px; transition: width .4s; }

.ch-level { margin-bottom: 20px; border-left: 4px solid var(--lab-blue); transition: border-color .3s; }
.ch-level.done { border-left-color: var(--lab-green); }
.lv-head { display: flex; align-items: center; gap: 10px; padding: 16px 20px 0; flex-wrap: wrap; }
.lv-no {
  background: var(--lab-ink); color: #fff; font-size: 12px; font-weight: 700;
  padding: 3px 10px; border-radius: 6px;
}
.lv-head h3 { font-size: 16.5px; }
.lv-points { color: var(--lab-ink-3); font-size: 12px; margin-left: auto; }
.lv-task { padding: 10px 20px 0; color: var(--lab-ink-2); font-size: 13.5px; }
.lv-body { padding: 14px 20px 6px; }
.lv-check { display: flex; gap: 10px; padding: 10px 20px 18px; }
.lv-check input {
  flex: 1; height: 38px; border: 1.5px solid var(--lab-line); border-radius: 9px;
  padding: 0 12px; font-size: 13.5px; outline: none; font-family: var(--lab-mono);
}
.lv-check input:focus { border-color: var(--lab-blue); }

#movie-list { list-style: none; padding: 0; margin: 0; }
#movie-list li { display: flex; gap: 10px; padding: 6px 10px; border-bottom: 1px dashed #e2e8f0; font-size: 13.5px; align-items: baseline; }
.m-rank { width: 24px; color: #94a3b8; font-family: var(--lab-mono); }
.m-title { font-weight: 600; color: var(--lab-ink); }
.m-year { color: #94a3b8; font-size: 12.5px; }
.m-tag { margin-left: auto; color: var(--lab-ink-3); font-size: 12.5px; }

.loading-line { color: #94a3b8; font-size: 13px; margin: 0; }
.news-list { list-style: none; padding: 0; margin: 0; }
.news-item { padding: 6px 2px; font-size: 13.5px; border-bottom: 1px dashed #e2e8f0; display: flex; gap: 10px; }
.news-date { color: #94a3b8; font-size: 12px; font-family: var(--lab-mono); flex: 0 0 auto; }

.faq-item { border: 1px solid var(--lab-line); border-radius: 9px; margin-bottom: 8px; overflow: hidden; }
.faq-q { margin: 0; padding: 10px 14px; cursor: pointer; font-size: 13.5px; font-weight: 600; user-select: none; }
.faq-q:hover { background: #f8fafc; }
.faq-mark { color: var(--lab-blue); margin-right: 8px; font-family: var(--lab-mono); }
.faq-a { margin: 0; padding: 0 14px 12px 36px; color: var(--lab-ink-2); font-size: 13px; }

#sales-table { width: 100%; border-collapse: collapse; font-size: 12.8px; }
#sales-table th, #sales-table td { border: 1px solid var(--lab-line); padding: 6px 10px; text-align: left; }
#sales-table th { background: #f8fafc; }
.pager { display: flex; gap: 8px; margin-top: 12px; }
.pager-btn {
  width: 34px; height: 30px; border: 1px solid var(--lab-line); border-radius: 7px;
  background: #fff; font-size: 13px; color: var(--lab-ink-2);
}
.pager-btn.cur { background: var(--lab-blue); border-color: var(--lab-blue); color: #fff; font-weight: 700; }

#secret-panel { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 14px 16px; }
.secret-line { margin: 0 0 8px; font-size: 13px; color: var(--lab-ink-2); word-break: break-all; }
.secret-line code { font-family: var(--lab-mono); color: #b91c1c; background: #fee2e2; padding: 2px 6px; border-radius: 5px; }
.lv-code { margin: 12px 0 0; max-height: 220px; overflow: auto; }
</style>
