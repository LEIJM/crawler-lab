<script setup>
/**
 * 伪人邮 · 搜索结果页（/search?keyword=xx&jc=）
 *
 * 本页 URL 形态与 notebook 中 driver.current_url 打印结果一致：
 *   /search?keyword=%E5%A4%A7%E6%95%B0%E6%8D%AE&jc=
 * 本页由书城首页「搜索」按钮通过 window.open 在新窗口打开
 * （对应 driver.switch_to.window(driver.window_handles[1])）。
 *
 * 书名结构契约：.book_item > a > p（notebook 用 BeautifulSoup select 抓取书名）。
 */
import { ref, computed, onMounted, watchEffect } from 'vue'
import BookCard from '../components/BookCard.vue'
import { searchBooks } from '../data/books.js'
import { ryUser, logoutRy } from '../lib/auth.js'

const PER_PAGE = 12
const keyword = ref('')

const kwParam = () => String(new URLSearchParams(location.search).get('keyword') || '')
const pageParam = () => Number(new URLSearchParams(location.search).get('page')) || 1
const keywordQuery = computed(() => kwParam())
const page = computed(() => Math.max(1, pageParam()))

const filtered = computed(() => searchBooks(keywordQuery.value))
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER_PAGE)))
const curPage = computed(() => Math.min(page.value, totalPages.value))
const pageBooks = computed(() => filtered.value.slice((curPage.value - 1) * PER_PAGE, curPage.value * PER_PAGE))

function searchHref(p) {
  const kw = encodeURIComponent(keywordQuery.value || '')
  return `/search?keyword=${kw}&jc=&page=${p}`
}

const user = ref(null)
function refreshUser() { user.value = ryUser() }
function doLogout() { logoutRy(); refreshUser() }

function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  window.location.href = `/search?keyword=${encodeURIComponent(kw)}&jc=&page=1`
}

onMounted(() => {
  keyword.value = keywordQuery.value
  refreshUser()
})
watchEffect(() => {
  document.title = `${keywordQuery.value ? '搜索：' + keywordQuery.value + ' - ' : '全部图书 - '}人民邮电出版社`
})
</script>

<template>
  <div class="pt-page">
    <!-- 头部（结构与书城首页一致，保持 XPath 契约） -->
    <div id="header">
      <div class="h-inner">
        <div class="h-row">
          <div class="h-left">
            <a class="logo" href="/shopping/index">
              <span class="logo-badge">PT</span>
              <span class="logo-text">人民邮电出版社</span>
            </a>
            <span class="slogan">搜索结果页</span>
            <span v-if="user" class="welcome">欢迎你，{{ user.nickname }}
              <a href="javascript:;" class="mini-link" @click="doLogout">退出</a>
            </span>
            <a v-else class="mini-link login-link" href="/login">你好，请登录</a>
          </div>
          <div class="h-mid">
            <div class="h-nav">
              <a href="/shopping/index">首页</a>
              <a href="javascript:;">图书分类</a>
              <a href="javascript:;">新书推荐</a>
              <a href="javascript:;">排行榜</a>
              <a href="/login">会员中心</a>
            </div>
            <div class="h-notice">
              <span class="notice-bar">搜索提示：支持按书名 / 作者 / 分类 / 简介模糊匹配</span>
            </div>
            <div class="h-search">
              <input v-model="keyword" type="text" class="search-input" name="keyword"
                     placeholder="请输入书名 / 作者 / 关键词">
              <button class="search-btn" type="button" @click="doSearch">搜索</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="search-body">
      <p class="result-meta">
        「{{ keywordQuery || '全部图书' }}」共找到
        <strong class="num">{{ filtered.length }}</strong>
        本图书（第 {{ curPage }} / {{ totalPages }} 页）
      </p>

      <div v-if="filtered.length === 0" class="empty-box">
        <p class="empty-icon">🔍</p>
        <p>未找到与「{{ keywordQuery }}」相关的图书</p>
        <p class="empty-sub">换个关键词试试，比如 <a href="/search?keyword=%E5%A4%A7%E6%95%B0%E6%8D%AE&amp;jc=">大数据</a></p>
      </div>

      <div v-else class="book_grid">
        <BookCard v-for="b in pageBooks" :key="b.isbn" :book="b" />
      </div>

      <!-- 结果分页 -->
      <div class="search-pager" v-if="filtered.length > PER_PAGE">
        <a v-if="curPage > 1" :href="searchHref(curPage - 1)">上一页</a>
        <a v-for="p in totalPages" :key="p" :href="searchHref(p)" :class="{ cur: p === curPage }">{{ p }}</a>
        <a v-if="curPage < totalPages" :href="searchHref(curPage + 1)">下一页</a>
      </div>

      <div class="pt-teach">
        教学提示：本页图书由 <code class="code-inline">.book_item &gt; a &gt; p</code> 结构呈现，
        notebook 中 <code class="code-inline">soup.select('.book_item &gt; a &gt; p')</code>
        即可抓取全部书名；若立即解析 page_source 为空，请先
        <code class="code-inline">WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, '.book_item')))</code>
        等待渲染完成。
      </div>
    </div>

    <footer class="pt-footer">
      <p>人民邮电出版社（教学模拟站） · 仅用于 Data221 课程爬虫实训</p>
    </footer>
  </div>
</template>

<style scoped>
.pt-page { min-height: 100vh; background: #f7f7f7; font-family: var(--lab-font); display: flex; flex-direction: column; }
#header { background: #fff; border-bottom: 2px solid #e60012; }
.h-inner { padding: 0 24px; }
.h-row { display: flex; align-items: center; gap: 20px; padding: 14px 0; }
.h-left { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.logo { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
.logo-badge {
  width: 38px; height: 38px; background: #e60012; color: #fff; border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px;
}
.logo-text { font-size: 20px; font-weight: 700; color: #2a2a2a; letter-spacing: 1px; }
.slogan { font-size: 12px; color: #999; border-left: 1px solid #eee; padding-left: 12px; }
.welcome { font-size: 13px; color: #e60012; }
.mini-link { font-size: 13px; color: #e60012; }
.login-link { margin-left: 4px; }
.h-mid { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
.h-nav { display: flex; gap: 22px; font-size: 14px; }
.h-nav a { color: #333; text-decoration: none; }
.h-nav a:hover { color: #e60012; }
.h-notice {
  font-size: 12px; color: #b45309; background: #fffbeb; border: 1px solid #fde68a;
  border-radius: 6px; padding: 2px 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.h-search { display: flex; align-items: stretch; }
.search-input {
  width: 380px; max-width: 60vw; height: 38px; border: 2px solid #e60012; border-right: none;
  border-radius: 4px 0 0 4px; padding: 0 12px; font-size: 13.5px; outline: none; box-sizing: border-box;
}
.search-btn {
  height: 38px; padding: 0 26px; background: #e60012; color: #fff; font-size: 14px;
  letter-spacing: 2px; border: none; border-radius: 0 4px 4px 0; cursor: pointer;
}
.search-btn:hover { background: #c7000f; }

.search-body { max-width: 1200px; margin: 0 auto; padding: 22px 24px 30px; width: 100%; }
.result-meta { font-size: 14px; color: #555; margin: 0 0 16px; }
.result-meta .num { color: #e60012; font-size: 17px; padding: 0 2px; }
.book_grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; }
@media (max-width: 1100px) { .book_grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 700px) { .book_grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.empty-box { text-align: center; padding: 70px 0; color: #888; background: #fff; border-radius: 10px; }
.empty-icon { font-size: 40px; margin: 0 0 10px; }
.empty-sub { color: #aaa; font-size: 13px; margin-top: 6px; }
.search-pager { display: flex; gap: 8px; justify-content: center; margin: 28px 0 8px; flex-wrap: wrap; }
.search-pager a {
  padding: 6px 14px; border: 1px solid #e5e5e5; border-radius: 6px; background: #fff;
  color: #444; font-size: 13.5px; text-decoration: none;
}
.search-pager a:hover { border-color: #e60012; color: #e60012; text-decoration: none; }
.search-pager a.cur { background: #e60012; color: #fff; border-color: #e60012; }
.pt-teach {
  margin-top: 20px; padding: 10px 14px; background: #fff; border: 1px dashed #d9d9d9;
  border-radius: 8px; font-size: 12px; color: #888; line-height: 1.9;
}
.pt-footer { margin-top: auto; background: #2a2a2a; color: #bbb; text-align: center; padding: 22px 16px; font-size: 12.5px; }
</style>
