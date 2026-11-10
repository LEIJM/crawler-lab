<script setup>
/**
 * 伪人民邮电出版社 · 书城首页（/shopping/index）
 *
 * DOM 契约（对应 notebook 单元格「人民邮电出版社」）：
 *   XPath '//*[@id="header"]/div[1]/div/div[2]/div[3]/input'  → 搜索输入框
 *   XPath '//*[@id="header"]/div[1]/div/div[2]/div[3]/button' → 搜索按钮
 *
 *   为此 header 的 DOM 层级必须精确为：
 *   #header > div.h-inner > div.h-row > [div.h-left, div.h-mid > [div.h-nav, div.h-notice, div.h-search]]
 *   （h-mid 的第 3 个 div 即 .h-search，其中 input 与 button 为其直接子元素）
 *
 *   点击搜索按钮以 window.open 在新窗口打开 /search?keyword=xx&jc=，
 *   对应 notebook 中 driver.switch_to.window(driver.window_handles[1])。
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BookCard from '../components/BookCard.vue'
import { BOOKS, CATEGORIES } from '../data/books.js'
import { ryUser, logoutRy } from '../lib/auth.js'

const router = useRouter()
const keyword = ref('')

const recommend = computed(() => BOOKS.slice(0, 12))
const fresh = computed(() => [...BOOKS].slice(-12).reverse())

const NOTICE = '站内公告：2026 年春季教材征订已开始，团购请咨询各区域服务专线。'

function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) {
    // 与真实站点一致：空关键词不跳转
    keyword.value = ''
    return
  }
  window.open(`/search?keyword=${encodeURIComponent(kw)}&jc=`, '_blank')
}

function goCategory(cat) {
  window.open(`/search?keyword=${encodeURIComponent(cat)}&jc=`, '_blank')
}

const user = ref(null)
function refreshUser() {
  user.value = ryUser()
}
function doLogout() {
  logoutRy()
  refreshUser()
}

onMounted(() => {
  refreshUser()
  document.title = '人民邮电出版社-图书商城'
})
</script>

<template>
  <div class="pt-page">
    <!-- 头部（DOM 层级为教学契约，不可调整结构！） -->
    <div id="header">
      <div class="h-inner">
        <div class="h-row">
          <div class="h-left">
            <a class="logo" href="/shopping/index">
              <span class="logo-badge">PT</span>
              <span class="logo-text">人民邮电出版社</span>
            </a>
            <span class="slogan">教材教辅 · 科技出版</span>
            <span v-if="user" class="welcome">欢迎你，{{ user.nickname }}
              <a href="javascript:;" class="mini-link" @click="doLogout">退出</a>
            </span>
            <a v-else class="mini-link login-link" href="/login">你好，请登录</a>
          </div>
          <div class="h-mid">
            <div class="h-nav">
              <a href="/shopping/index">首页</a>
              <a href="javascript:;" @click.prevent="goCategory('教材')">图书分类</a>
              <a href="javascript:;" @click.prevent="goCategory('新书')">新书推荐</a>
              <a href="javascript:;" @click.prevent="goCategory('人工智能')">排行榜</a>
              <a href="/login">会员中心</a>
            </div>
            <div class="h-notice">
              <span class="notice-bar">{{ NOTICE }}</span>
            </div>
            <div class="h-search">
              <input v-model="keyword" type="text" class="search-input" name="keyword"
                     placeholder="请输入书名 / 作者 / 关键词，如：大数据">
              <button class="search-btn" type="button" @click="doSearch">搜索</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Banner -->
    <div class="pt-banner">
      <div class="banner-inner">
        <div class="banner-text">
          <h2>2026 春季计算机优秀教材联展</h2>
          <p>大数据 · 人工智能 · 程序设计 · 网络安全 全品种上新</p>
          <button class="banner-btn" type="button" @click="goCategory('大数据')">查看大数据教材</button>
        </div>
      </div>
    </div>

    <!-- 分类快捷入口 -->
    <div class="pt-cats">
      <span class="cats-label">分类：</span>
      <a v-for="c in CATEGORIES" :key="c" href="javascript:;" class="cat-chip" @click.prevent="goCategory(c)">{{ c }}</a>
    </div>

    <!-- 今日推荐 -->
    <section class="pt-section">
      <h2 class="sec-title">今日推荐</h2>
      <div class="book_grid">
        <BookCard v-for="b in recommend" :key="b.isbn" :book="b" />
      </div>
    </section>

    <!-- 新书速递 -->
    <section class="pt-section">
      <h2 class="sec-title">新书速递</h2>
      <div class="book_grid">
        <BookCard v-for="b in fresh" :key="b.isbn" :book="b" />
      </div>
    </section>

    <!-- 教学提示 -->
    <div class="pt-teach">
      教学提示：搜索框 XPath 为
      <code class="code-inline">//*[@id="header"]/div[1]/div/div[2]/div[3]/input</code>，
      搜索按钮为 <code class="code-inline">//*[@id="header"]/div[1]/div/div[2]/div[3]/button</code>；
      点击搜索后结果页在<b>新窗口</b>打开（window_handles[1]），结果页书名可由
      <code class="code-inline">.book_item &gt; a &gt; p</code> 抓取。
    </div>

    <!-- 页脚 -->
    <footer class="pt-footer">
      <p>人民邮电出版社（教学模拟站） · 仅用于 Data221 课程爬虫实训</p>
      <p class="ft-links">
        <a href="/shopping/index">商城首页</a> <span>|</span>
        <a href="/login">会员登录</a> <span>|</span>
        <a href="javascript:;">关于我们</a> <span>|</span>
        <a href="/docs">教学文档</a>
      </p>
    </footer>
  </div>
</template>

<style scoped>
.pt-page {
  min-height: 100vh;
  background: #f7f7f7;
  font-family: var(--lab-font);
  display: flex;
  flex-direction: column;
}

/* ---- 头部 ---- */
#header {
  background: #fff;
  border-bottom: 2px solid #e60012;
}
.h-inner { padding: 0 24px; }
.h-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 0;
}
.h-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}
.logo { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
.logo-badge {
  width: 38px;
  height: 38px;
  background: #e60012;
  color: #fff;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
}
.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #2a2a2a;
  letter-spacing: 1px;
}
.slogan { font-size: 12px; color: #999; border-left: 1px solid #eee; padding-left: 12px; }
.welcome { font-size: 13px; color: #e60012; }
.mini-link { font-size: 13px; color: #e60012; }
.login-link { margin-left: 4px; }
.h-mid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.h-nav { display: flex; gap: 22px; font-size: 14px; }
.h-nav a { color: #333; text-decoration: none; }
.h-nav a:hover { color: #e60012; }
.h-notice {
  font-size: 12px;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 2px 10px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.h-search { display: flex; align-items: stretch; }
.search-input {
  width: 380px;
  max-width: 60vw;
  height: 38px;
  border: 2px solid #e60012;
  border-right: none;
  border-radius: 4px 0 0 4px;
  padding: 0 12px;
  font-size: 13.5px;
  outline: none;
  box-sizing: border-box;
}
.search-input:focus { box-shadow: inset 0 0 0 1px rgba(230, 0, 18, 0.15); }
.search-btn {
  height: 38px;
  padding: 0 26px;
  background: #e60012;
  color: #fff;
  font-size: 14px;
  letter-spacing: 2px;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}
.search-btn:hover { background: #c7000f; }

/* ---- Banner ---- */
.pt-banner {
  background: linear-gradient(120deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%);
}
.banner-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 46px 24px;
  color: #fff;
}
.banner-text h2 { color: #fff; font-size: 26px; margin: 0 0 8px; }
.banner-text p { margin: 0 0 18px; opacity: 0.85; font-size: 14px; }
.banner-btn {
  background: #fff;
  color: #1d4ed8;
  border-radius: 8px;
  padding: 9px 22px;
  font-size: 14px;
  font-weight: 600;
}
.banner-btn:hover { background: #eff6ff; }

/* ---- 分类 ---- */
.pt-cats {
  max-width: 1200px;
  margin: 18px auto 0;
  padding: 0 24px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.cats-label { font-size: 13px; color: #666; }
.cat-chip {
  font-size: 13px;
  padding: 4px 14px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 999px;
  color: #444;
  text-decoration: none;
}
.cat-chip:hover { border-color: #e60012; color: #e60012; text-decoration: none; }

/* ---- 书籍区 ---- */
.pt-section { max-width: 1200px; margin: 22px auto 0; padding: 0 24px; width: 100%; }
.sec-title {
  font-size: 19px;
  color: #2a2a2a;
  margin: 0 0 14px;
  padding-left: 10px;
  border-left: 4px solid #e60012;
}
.book_grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}
@media (max-width: 1100px) { .book_grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 700px) { .book_grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

/* ---- 教学提示 ---- */
.pt-teach {
  max-width: 1160px;
  margin: 26px auto 6px;
  padding: 10px 14px;
  background: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  font-size: 12px;
  color: #888;
  line-height: 1.9;
}

/* ---- 页脚 ---- */
.pt-footer {
  margin-top: auto;
  background: #2a2a2a;
  color: #bbb;
  text-align: center;
  padding: 22px 16px;
  font-size: 12.5px;
}
.ft-links { margin-top: 8px; }
.ft-links a { color: #bbb; margin: 0 8px; }
.ft-links span { color: #555; }
</style>
