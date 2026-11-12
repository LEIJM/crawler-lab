<script setup>
/**
 * 选择器练习场（/playground）
 * 左侧：结构丰富的示例 DOM（校园新闻站）
 * 右侧：CSS / XPath 双模式实时查询，命中元素高亮 + 文本输出。
 * 预置 notebook 中出现过的全部选择器，便于课前验证。
 */
import { ref, computed, nextTick } from 'vue'

const mode = ref('css')            // css | xpath
const selector = ref('#news-list > li .news-title')
const matchedTexts = ref([])
const matchedCount = ref(0)
const queryError = ref('')
const lastRun = ref('')

// note 标明选择器目标元素的位置：本页可试 / 需到对应模拟站点页验证
// （P0 修复：此前部分预置在本页命中 0 个，学生误以为自己操作错了）
const PRESETS = [
  { mode: 'css', label: 'h3.t（百度结果标题）', sel: 'h3.t', note: '→ /s 结果页验证' },
  { mode: 'css', label: '.book_item > a > p（书名）', sel: '.book_item > a > p', note: '本页可试' },
  { mode: 'xpath', label: '//*[@id="kw"]（百度搜索框）', sel: '//*[@id="kw"]', note: '→ /baidu 页验证' },
  { mode: 'xpath', label: '//*[@id="page"]/div/a[last()]（下一页）', sel: '//*[@id="page"]/div/a[last()]', note: '本页可试' },
  { mode: 'xpath', label: '//*[@id="header"]/div[1]/div/div[2]/div[3]/input', sel: '//*[@id="header"]/div[1]/div/div[2]/div[3]/input', note: '→ /shopping/index 页验证' },
  { mode: 'xpath', label: '//*[@id="loginForm"]/div[1]/input', sel: '//*[@id="loginForm"]/div[1]/input', note: '→ /login 页验证' },
  { mode: 'css', label: '.verCodeImg（验证码图）', sel: '.verCodeImg', note: '→ /login 页验证' },
  { mode: 'xpath', label: '//li[contains(@class,"hot")]//a', sel: '//li[contains(@class,"hot")]//a', note: '本页可试' }
]

const NEWS = [
  { cls: 'hot', title: '我校学子在全国大学生大数据竞赛中获一等奖', date: '2026-11-02', author: '教务处' },
  { cls: '', title: '计算机学院举办人工智能通识教育研讨会', date: '2026-10-28', author: '科研处' },
  { cls: 'top', title: '2026 年秋季 Python 程序设计实训安排发布', date: '2026-10-21', author: '实训中心' },
  { cls: '', title: '网络爬虫课程上线新的实训平台', date: '2026-10-15', author: '信息学院' },
  { cls: 'hot', title: '数据科学与大数据技术专业招生简章', date: '2026-09-30', author: '招生办' }
]

const TEACHERS = [
  { name: '王建国', title: '教授', course: '大数据技术导论' },
  { name: '李梅', title: '副教授', course: 'Python 程序设计' },
  { name: '张华', title: '讲师', course: '网络爬虫与数据采集' },
  { name: '陈静', title: '实验师', course: '数据库原理' }
]

const SCORES = [
  ['20240101', '张三', 'Python 程序设计', 92],
  ['20240102', '李四', 'Python 程序设计', 85],
  ['20240103', '王五', '数据结构', 78],
  ['20240104', '赵六', '网络爬虫', 95]
]

function clearHighlight() {
  document.querySelectorAll('.pg-hl').forEach((el) => {
    el.classList.remove('pg-hl')
    el.style.outline = ''
    el.style.background = ''
  })
}

function clearAll() {
  clearHighlight()
  matchedCount.value = 0
  matchedTexts.value = []
  lastRun.value = ''
  queryError.value = ''
}

function runQuery() {
  queryError.value = ''
  matchedTexts.value = []
  matchedCount.value = 0
  lastRun.value = selector.value.trim()
  clearHighlight()
  const sel = selector.value.trim()
  if (!sel) { queryError.value = '请输入选择器'; return }

  let elements = []
  try {
    if (mode.value === 'css') {
      elements = [...document.querySelectorAll(sel)]
    } else {
      const it = document.evaluate(sel, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
      for (let i = 0; i < it.snapshotLength; i++) {
        const n = it.snapshotItem(i)
        if (n.nodeType === 1) elements.push(n)
      }
    }
  } catch (e) {
    queryError.value = '选择器语法错误：' + e.message
    return
  }

  matchedCount.value = elements.length
  // P0 修复：命中 0 时给出解释而非空白，避免学生误判为自己操作错误
  matchedTexts.value = elements.length === 0
    ? ['本页未命中。该选择器的目标元素可能位于对应模拟站点页（如 /baidu、/login、/s），请按预置标注前往实际页面验证。']
    : elements.slice(0, 30).map((el) => {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim()
    return t.length > 46 ? t.slice(0, 46) + '…' : t
  })
  elements.slice(0, 30).forEach((el) => {
    el.classList.add('pg-hl')
    el.style.outline = '2px solid #f59e0b'
    el.style.outlineOffset = '1px'
    el.style.background = 'rgba(245, 158, 11, 0.18)'
  })
  nextTick(() => {
    const first = document.querySelector('.pg-hl')
    if (first && mode.value) first.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

function usePreset(p) {
  mode.value = p.mode
  selector.value = p.sel
  runQuery()
}

const sampleResults = computed(() => [
  { t: '第 1 章 数据采集概述', u: 'news.example.com' },
  { t: '第 2 章 HTTP 协议基础', u: 'news.example.com' },
  { t: '第 3 章 HTML 与 XPath', u: 'news.example.com' }
])
</script>

<template>
  <div class="lab-container pg-wrap">
    <div class="pg-head">
      <div>
        <h2>选择器练习场</h2>
        <p class="pg-sub">左侧是一个迷你"校园新闻站"页面。右侧输入 CSS / XPath 选择器，命中元素会被橙色高亮。</p>
      </div>
      <span class="lab-tag blue">课堂热身工具</span>
    </div>

    <div class="pg-layout">
      <!-- 左：示例 DOM -->
      <div class="lab-card pg-sample" id="sample-dom">
        <div id="header">
          <div class="logo-bar">
            <span class="site-name">明德学院 · 计算机与信息学院</span>
            <div class="top-links">
              <a href="javascript:;" class="nav-a">首页</a>
              <a href="javascript:;" class="nav-a">院系设置</a>
              <a href="javascript:;" class="nav-a">师资队伍</a>
              <a href="javascript:;" class="nav-a">通知公告</a>
            </div>
          </div>
        </div>

        <div class="banner">
          <h3 class="banner-title">笃学不倦 · 格物致知</h3>
        </div>

        <div class="cols">
          <div class="col-main">
            <h4 class="block-title">学院要闻</h4>
            <ul id="news-list">
              <li v-for="(n, i) in NEWS" :key="i" :class="n.cls">
                <a href="javascript:;"><span class="news-title">{{ n.title }}</span></a>
                <span class="meta">{{ n.date }} · {{ n.author }}</span>
              </li>
            </ul>

            <h4 class="block-title">推荐阅读</h4>
            <div class="book_item" v-for="r in sampleResults" :key="r.t">
              <a href="javascript:;"><p>{{ r.t }}</p></a>
              <p class="src">{{ r.u }}</p>
            </div>
          </div>

          <div class="col-side">
            <h4 class="block-title">教师简介</h4>
            <ul class="teacher-list">
              <li v-for="t in TEACHERS" :key="t.name" class="teacher-card">
                <span class="t-name">{{ t.name }}</span>
                <span class="t-title">{{ t.title }}</span>
                <span class="t-course">{{ t.course }}</span>
              </li>
            </ul>

            <h4 class="block-title">成绩查询</h4>
            <table id="score-table">
              <thead><tr><th>学号</th><th>姓名</th><th>课程</th><th>分数</th></tr></thead>
              <tbody>
                <tr v-for="s in SCORES" :key="s[0]"><td>{{ s[0] }}</td><td>{{ s[1] }}</td><td>{{ s[2] }}</td><td>{{ s[3] }}</td></tr>
              </tbody>
            </table>

            <h4 class="block-title">站内搜索</h4>
            <form id="site-search" @submit.prevent>
              <input type="text" class="s-input" placeholder="关键词">
              <button type="submit" class="s-btn">搜索</button>
            </form>
          </div>
        </div>

        <!-- 仿百度分页块：供 #page 选择器练习 -->
        <div id="page">
          <div class="page-inner">
            <strong>1</strong>
            <a href="javascript:;">2</a>
            <a href="javascript:;">3</a>
            <a class="n" href="javascript:;">下一页&gt;</a>
          </div>
        </div>
      </div>

      <!-- 右：查询面板 -->
      <div class="pg-panel">
        <div class="lab-card pg-query-card">
          <div class="mode-switch">
            <button :class="{ on: mode === 'css' }" :aria-pressed="mode === 'css'" @click="mode = 'css'">CSS 选择器</button>
            <button :class="{ on: mode === 'xpath' }" :aria-pressed="mode === 'xpath'" @click="mode = 'xpath'">XPath</button>
          </div>
          <textarea v-model="selector" class="pg-input" rows="3" spellcheck="false"
                    aria-label="CSS 或 XPath 选择器输入"
                    :placeholder="mode === 'css' ? '如：.book_item > a > p' : '如：//*[@id=&quot;kw&quot;]'"
                    @keydown.ctrl.enter="runQuery"></textarea>
          <div class="pg-actions">
            <button class="lab-btn" @click="runQuery">运行查询（Ctrl+Enter）</button>
            <button class="lab-btn ghost" @click="clearAll">清除高亮</button>
          </div>

          <p v-if="queryError" class="pg-error">{{ queryError }}</p>
          <div v-else class="pg-result">
            <p class="pg-count">共命中 <b>{{ matchedCount }}</b> 个元素<span v-if="lastRun"> · {{ mode === 'css' ? 'CSS' : 'XPath' }}</span></p>
            <ol class="pg-texts">
              <li v-for="(t, i) in matchedTexts" :key="i">{{ t || '（空文本元素）' }}</li>
            </ol>
          </div>
        </div>

        <div class="lab-card pg-preset-card">
          <h4>notebook 选择器速查</h4>
          <p class="hint">点击任一预置即可试跑。带「→」标注的目标元素在对应模拟站点页，本页会提示未命中：</p>
          <div class="preset-list">
            <button v-for="p in PRESETS" :key="p.sel" class="preset" @click="usePreset(p)">
              <span class="lab-tag" :class="p.mode === 'css' ? 'blue' : 'green'">{{ p.mode }}</span>
              <span class="preset-label">{{ p.label }}</span>
              <span class="preset-note">{{ p.note }}</span>
            </button>
          </div>
        </div>

        <div class="lab-card pg-note-card">
          <h4>小抄</h4>
          <p class="cheat-group">XPath</p>
          <ul class="cheat">
            <li><code class="code-inline">//div[@id]</code> 选所有带 id 的 div</li>
            <li><code class="code-inline">//a[contains(text(),'通知')]</code> 文本包含匹配</li>
            <li><code class="code-inline">//button[text()="搜索"]</code> 按按钮文字定位（闯关第 3 关点击展开会用）</li>
            <li><code class="code-inline">//input[@type="text"]</code> 按属性匹配</li>
            <li><code class="code-inline">//*[@id="x"]/div[1]</code> 按位置索引（从 1 开始）</li>
            <li><code class="code-inline">a[last()]</code> 取最后一个（notebook 翻页用法）</li>
            <li><code class="code-inline">//*[@id="kw"]</code> → CSS 等价写法 <code class="code-inline">#kw</code>（id、class 优先用 CSS 更短）</li>
          </ul>
          <p class="cheat-group">CSS</p>
          <ul class="cheat">
            <li><code class="code-inline">.cls > a > p</code> 仅选直接子元素</li>
            <li><code class="code-inline">input[name="wd"]</code> 按属性选择（百度搜索框）</li>
            <li><code class="code-inline">h3.t</code> 同时匹配标签 + class</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pg-wrap { padding-top: 30px; padding-bottom: 50px; }
.pg-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 14px; }
.pg-head h2 { font-size: 24px; }
.pg-sub { color: var(--lab-ink-3); font-size: 13.5px; margin: 6px 0 0; max-width: 640px; }

.pg-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; align-items: start; }
@media (max-width: 1000px) { .pg-layout { grid-template-columns: 1fr; } }

/* 示例 DOM 样式（尽量还原普通校园站点观感） */
.pg-sample { padding: 0; overflow: hidden; font-size: 13px; color: #333; }
.pg-sample .logo-bar {
  background: #1e3a8a;
  color: #fff;
  padding: 12px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.site-name { font-size: 15px; font-weight: 700; letter-spacing: 1px; }
.top-links { display: flex; gap: 14px; }
.top-links .nav-a { color: #dbeafe; font-size: 12.5px; }
.banner {
  background: linear-gradient(120deg, #2563eb, #38bdf8);
  padding: 22px 18px;
}
.banner-title { color: #fff; margin: 0; font-size: 17px; letter-spacing: 3px; }
.cols { display: flex; gap: 18px; padding: 16px; }
.col-main { flex: 1.3; min-width: 0; }
.col-side { flex: 1; min-width: 0; }
.block-title {
  font-size: 14px;
  border-left: 3px solid #2563eb;
  padding-left: 8px;
  margin: 0 0 10px;
  color: #1e3a8a;
}
#news-list { list-style: none; padding: 0; margin: 0 0 18px; }
#news-list li {
  padding: 8px 2px;
  border-bottom: 1px dashed #e5e7eb;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
#news-list li.hot .news-title::after {
  content: '热';
  color: #fff; background: #ef4444; font-size: 10px;
  border-radius: 4px; padding: 1px 4px; margin-left: 6px; vertical-align: 1px;
}
#news-list li.top .news-title::after {
  content: '顶';
  color: #fff; background: #f59e0b; font-size: 10px;
  border-radius: 4px; padding: 1px 4px; margin-left: 6px; vertical-align: 1px;
}
.news-title { color: #1e3a8a; font-size: 13.5px; }
.meta { color: #94a3b8; font-size: 11.5px; }
.book_item { padding: 6px 0; border-bottom: 1px dashed #e5e7eb; }
.book_item a { color: #166534; }
.book_item .src { color: #94a3b8; font-size: 11.5px; margin: 2px 0 0; }
.teacher-list { list-style: none; padding: 0; margin: 0 0 18px; }
.teacher-card {
  display: flex; gap: 8px; align-items: center;
  padding: 6px 8px; margin-bottom: 6px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
}
.t-name { font-weight: 700; color: #0f172a; }
.t-title { color: #2563eb; font-size: 12px; }
.t-course { color: #64748b; font-size: 12px; }
#score-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
#score-table th, #score-table td { border: 1px solid #e2e8f0; padding: 5px 8px; font-size: 12px; text-align: left; }
#score-table th { background: #f1f5f9; }
#site-search { display: flex; gap: 8px; }
.s-input {
  flex: 1; height: 30px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0 10px; outline: none;
}
.s-btn {
  height: 30px; padding: 0 14px; background: #2563eb; color: #fff; border-radius: 6px; font-size: 12.5px;
}
#page { padding: 8px 16px 18px; }
#page .page-inner { display: flex; gap: 6px; }
#page strong { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 3px 10px; }
#page a { color: #1e3a8a; padding: 3px 10px; border: 1px solid #fff; border-radius: 6px; }

/* 查询面板 */
.pg-panel { display: flex; flex-direction: column; gap: 16px; }
.mode-switch {
  display: inline-flex; background: #eef2f7; border-radius: 10px; padding: 3px; margin-bottom: 12px;
}
.mode-switch button {
  padding: 7px 16px; border-radius: 8px; font-size: 13px; color: var(--lab-ink-3); font-weight: 600;
}
.mode-switch button.on { background: #fff; color: var(--lab-ink); box-shadow: 0 1px 4px rgba(15,23,42,.12); }
.pg-query-card, .pg-preset-card, .pg-note-card { padding: 18px; }
.pg-input {
  width: 100%;
  border: 1.5px solid var(--lab-line);
  border-radius: 10px;
  padding: 10px 12px;
  font-family: var(--lab-mono);
  font-size: 13px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}
.pg-input:focus { border-color: var(--lab-blue); }
.pg-actions { display: flex; gap: 10px; margin-top: 12px; }
.pg-error {
  margin: 12px 0 0; color: var(--lab-red); font-size: 13px;
  background: var(--lab-red-bg); border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px;
}
.pg-result { margin-top: 12px; }
.pg-count { color: var(--lab-ink-2); font-size: 13.5px; margin: 0 0 8px; }
.pg-count b { color: var(--lab-blue); font-size: 16px; }
.pg-texts {
  margin: 0; padding-left: 20px; font-size: 12.5px; color: var(--lab-ink-2);
  max-height: 200px; overflow-y: auto;
}
.preset-note { margin-left: auto; font-size: 11.5px; color: #5f6b7a; flex: 0 0 auto; }
.cheat-group { margin: 10px 0 4px; font-size: 12px; font-weight: 700; color: var(--lab-ink-3); letter-spacing: 1px; }
.cheat-group:first-of-type { margin-top: 0; }
.pg-texts li { padding: 2px 0; word-break: break-all; }
.pg-preset-card h4, .pg-note-card h4 { margin: 0 0 8px; font-size: 15px; }
.pg-preset-card .hint { font-size: 12px; color: var(--lab-ink-3); margin: 0 0 10px; }
.preset-list { display: flex; flex-direction: column; gap: 6px; }
.preset {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border: 1px solid var(--lab-line); border-radius: 8px;
  background: #fff; font-size: 12.5px; text-align: left; transition: border-color .15s;
}
.preset:hover { border-color: var(--lab-blue); }
.preset-label { color: var(--lab-ink-2); word-break: break-all; }
.cheat { margin: 0; padding-left: 18px; font-size: 12.5px; color: var(--lab-ink-2); }
.cheat li { margin-bottom: 6px; }
</style>
