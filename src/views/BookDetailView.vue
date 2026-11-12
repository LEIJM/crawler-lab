<script setup>
/**
 * 图书详情页（/shopping/detail?isbn=xxx）
 * 提供更深的爬取目标：出版信息、价格、目录等结构化数据。
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import BookCard from '../components/BookCard.vue'
import { BOOKS, findBook, coverGradient } from '../data/books.js'

const route = useRoute()
const book = computed(() => findBook(route.query.isbn))
const related = computed(() => {
  if (!book.value) return []
  return BOOKS.filter(b => b.category === book.value.category && b.isbn !== book.value.isbn).slice(0, 6)
})
const gradient = computed(() => book.value ? coverGradient(book.value.isbn) : '')
const toc = computed(() => {
  if (!book.value) return []
  const names = ['基础认知', '核心原理', '关键技术', '项目实战', '进阶拓展', '综合实训', '课程思政与延伸阅读', '附录与习题参考答案']
  return names.map((n, i) => `第${i + 1}章　${n}`)
})

// P2 优化：交互反馈改内联提示（原 window.alert 中断式弹窗与全站风格断裂）
const actMsg = ref('')
function mockAction(action) {
  actMsg.value = `「${action}」为教学演示：本站未实现下单功能，仅提供页面结构供爬虫练习。`
}

onMounted(() => {
  document.title = book.value ? `${book.value.title} - 人民邮电出版社` : '图书未找到 - 人民邮电出版社'
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
            <span class="slogan">图书详情</span>
            <a class="mini-link login-link" href="/login">你好，请登录</a>
          </div>
          <div class="h-mid">
            <div class="h-nav">
              <a href="/shopping/index">首页</a>
              <a href="javascript:;">图书分类</a>
              <a href="javascript:;">新书推荐</a>
              <a href="javascript:;">排行榜</a>
              <a href="/login">会员中心</a>
            </div>
            <div class="h-notice"><span class="notice-bar">详情页数据均为教学模拟数据</span></div>
            <div class="h-search">
              <input type="text" class="search-input search-input--dead" placeholder="详情页不支持搜索，请返回首页"
                     aria-label="搜索框（详情页未启用）" tabindex="-1">
              <button class="search-btn" type="button" disabled aria-disabled="true">搜索</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-body" v-if="book">
      <nav class="crumb"><a href="/shopping/index">商城首页</a> › <a :href="`/search?keyword=${encodeURIComponent(book.category)}&jc=`">{{ book.category }}</a> › <span>正文详情</span></nav>

      <div class="detail-card">
        <div class="d-cover" :style="{ background: gradient }">
          <span class="d-cover-title">{{ book.title }}</span>
          <span class="d-cover-pub">人民邮电出版社</span>
        </div>
        <div class="d-info">
          <h1 class="d-title">{{ book.title }}</h1>
          <p class="d-meta">作者：<span class="d-strong">{{ book.author }}</span>　　出版社：<span class="d-strong">人民邮电出版社</span></p>
          <p class="d-meta">出版时间：<span class="d-strong">{{ book.pubDate }}</span>　　ISBN：<span class="d-strong">{{ book.isbn }}</span></p>
          <p class="d-meta">页数：<span class="d-strong">{{ book.pages }} 页</span>　　分类：<span class="d-strong">{{ book.category }}</span></p>
          <p class="d-price">￥<span class="d-price-num">{{ book.price.toFixed(2) }}</span></p>
          <p class="d-intro">{{ book.intro }}</p>
          <div class="d-acts">
            <button class="buy-btn" type="button" @click="mockAction('加入购物车')">加入购物车</button>
            <button class="cart-btn" type="button" @click="mockAction('立即购买')">立即购买</button>
          </div>
          <p v-if="actMsg" class="act-msg" role="status">{{ actMsg }}</p>
        </div>
      </div>

      <section class="d-section">
        <h3 class="d-sec-title">内容简介</h3>
        <p class="d-text">{{ book.intro }}本书配套电子课件、源码与数据集，适合作为高等院校相关专业的教材，也适合自学者参考。</p>
      </section>

      <section class="d-section">
        <h3 class="d-sec-title">目录（节选）</h3>
        <ul class="d-toc">
          <li v-for="(c, i) in toc" :key="i">{{ c }}</li>
        </ul>
      </section>

      <section class="d-section">
        <h3 class="d-sec-title">同类图书</h3>
        <div class="book_grid">
          <BookCard v-for="b in related" :key="b.isbn" :book="b" />
        </div>
      </section>
    </div>

    <div class="detail-body" v-else>
      <div class="empty-box">
        <p>未找到该 ISBN 对应的图书</p>
        <p class="empty-sub"><a href="/shopping/index">返回书城首页</a></p>
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
.logo-badge { width: 38px; height: 38px; background: #e60012; color: #fff; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; }
.logo-text { font-size: 20px; font-weight: 700; color: #2a2a2a; }
.slogan { font-size: 12px; color: #999; border-left: 1px solid #eee; padding-left: 12px; }
.mini-link { font-size: 13px; color: #e60012; }
.h-mid { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
.h-nav { display: flex; gap: 22px; font-size: 14px; }
.h-nav a { color: #333; text-decoration: none; }
.h-notice { font-size: 12px; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 2px 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h-search { display: flex; align-items: stretch; }
.search-input { width: 380px; max-width: 60vw; height: 38px; border: 2px solid #e60012; border-right: none; border-radius: 4px 0 0 4px; padding: 0 12px; font-size: 13.5px; outline: none; box-sizing: border-box; }
.search-btn { height: 38px; padding: 0 26px; background: #e60012; color: #fff; font-size: 14px; border: none; border-radius: 0 4px 4px 0; }

.detail-body { max-width: 1200px; margin: 0 auto; padding: 22px 24px 40px; width: 100%; }
.crumb { font-size: 13px; color: #999; margin-bottom: 16px; }
.crumb a { color: #666; }
.detail-card { display: flex; gap: 28px; background: #fff; border-radius: 12px; padding: 26px; }
.d-cover {
  width: 260px; height: 350px; border-radius: 8px; flex: 0 0 auto;
  display: flex; flex-direction: column; justify-content: flex-end; padding: 18px; color: #fff;
}
.d-cover-title { font-size: 19px; font-weight: 700; line-height: 1.5; text-shadow: 0 2px 6px rgba(0,0,0,.3); }
.d-cover-pub { margin-top: 8px; font-size: 12px; opacity: .85; }
.d-info { flex: 1; min-width: 0; }
.d-title { font-size: 24px; margin: 0 0 14px; color: #222; }
.d-meta { font-size: 14px; color: #666; margin: 6px 0; }
.d-strong { color: #333; font-weight: 600; }
.d-price { margin: 18px 0 10px; color: #e60012; font-size: 14px; }
.d-price-num { font-size: 30px; font-weight: 700; }
.d-intro { font-size: 13.5px; color: #777; line-height: 1.8; background: #fafafa; padding: 10px 14px; border-radius: 8px; }
.d-acts { margin-top: 20px; display: flex; gap: 12px; }
.buy-btn { background: #ff7a00; color: #fff; padding: 11px 30px; border-radius: 8px; font-size: 15px; font-weight: 600; }
.cart-btn { background: #e60012; color: #fff; padding: 11px 30px; border-radius: 8px; font-size: 15px; font-weight: 600; }
.act-msg { margin: 10px 0 0; font-size: 12.5px; color: #5f6b7a; background: #fff7f7; border: 1px dashed #f5b5b5; border-radius: 6px; padding: 6px 10px; }
.search-input--dead { border-color: #d9d9d9; color: #aaa; }
.d-section { margin-top: 26px; background: #fff; border-radius: 12px; padding: 20px 26px; }
.d-sec-title { font-size: 17px; margin: 0 0 12px; color: #222; border-left: 4px solid #e60012; padding-left: 10px; }
.d-text { font-size: 14px; color: #555; line-height: 1.9; margin: 0; }
.d-toc { list-style: none; padding: 0; margin: 0; columns: 2; }
.d-toc li { font-size: 14px; color: #555; padding: 5px 0; border-bottom: 1px dashed #f0f0f0; }
.book_grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; }
@media (max-width: 1100px) { .book_grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 700px) { .book_grid, .d-toc { grid-template-columns: repeat(2, minmax(0, 1fr)); columns: 1; } .detail-card { flex-direction: column; } .d-cover { width: 200px; height: 270px; } }
.empty-box { text-align: center; padding: 80px 0; color: #888; background: #fff; border-radius: 10px; }
.empty-sub a { color: #e60012; }
.pt-footer { margin-top: auto; background: #2a2a2a; color: #bbb; text-align: center; padding: 22px 16px; font-size: 12.5px; }
</style>
