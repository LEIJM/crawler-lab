<script setup>
/**
 * 伪百度搜索结果页（/s?wd=关键词&pn=偏移）
 *
 * DOM 契约（对应 notebook 单元格 0）：
 *   标题设为 `{wd}_百度搜索`       → WebDriverWait(title_contains("转本")) 通过
 *   结果以 <h3 class="t"> 呈现      → driver.find_elements(By.CSS_SELECTOR, 'h3.t')
 *   #page > div 内：strong=当前页码、a=其他页码、a[last()]="下一页>"
 *     → driver.find_element(By.XPATH, '//*[@id="page"]/div/a[last()]')
 *   最后一页不再出现「下一页」，复刻真实站点行为：
 *     循环点击翻页最终会抛 NoSuchElementException，是课堂讲解异常终止的好案例。
 */
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { generateResults, MAX_PAGES } from '../lib/baidu-results.js'
import { baiduUI, openBaiduLogin, refreshBaiduUser } from '../lib/baidu-ui.js'

const route = useRoute()
const router = useRouter()

const PER_PAGE = 10
const wd = computed(() => String(route.query.wd || '').trim() || '百度搜索')
const pn = computed(() => {
  const n = Number(route.query.pn)
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), (MAX_PAGES - 1) * PER_PAGE) : 0
})
const page = computed(() => Math.floor(pn.value / PER_PAGE) + 1)
const results = computed(() => generateResults(wd.value, page.value))

const pageNums = computed(() => {
  const cur = page.value
  const out = []
  for (let i = 1; i <= MAX_PAGES; i++) if (i !== cur) out.push(i)
  return out
})

function pageHref(p) {
  return { path: '/s', query: { ...route.query, wd: wd.value, pn: String((p - 1) * PER_PAGE) } }
}

function goSearchBox() {
  router.push('/baidu')
}

function doLogin() {
  openBaiduLogin()
}

// 标题必须包含搜索词（title_contains 教学契约）。
// 注意：翻页是 query-only 跳转，computed 值可能不变导致 watchEffect 不触发，
// 因此监听 route.fullPath 保证每次导航都重写标题。
watch(() => route.fullPath, () => {
  document.title = `${wd.value}_百度搜索`
  refreshBaiduUser()
}, { immediate: true })
</script>

<template>
  <div class="s-page">
    <!-- 顶部搜索区 -->
    <div class="s-topbar">
      <div class="s-topbar-inner">
        <a class="s-logo" href="/baidu" @click.prevent="goSearchBox">百度</a>
        <form class="s-searchform" @submit.prevent="goSearchBox">
          <span class="s-box">
            <input id="kw" class="s_ipt" type="text" name="wd" :value="wd" @keydown.enter.prevent="goSearchBox">
            <input id="su" class="btn" type="submit" value="百度一下">
          </span>
        </form>
        <div class="s-user">
          <a id="s-top-loginbtn" class="s-login" href="javascript:;" @click="doLogin">
            <template v-if="baiduUI.user">{{ baiduUI.user.nickname }}</template>
            <template v-else>登录</template>
          </a>
        </div>
      </div>
    </div>

    <!-- 结果区 -->
    <div class="s-result-wrap">
      <div class="s-results">
        <p class="s-tips">百度为您找到相关结果约 {{ 100000 + wd.length * 77 }} 个（教学模拟数据）</p>

        <div v-for="(r, i) in results" :key="i" class="result">
          <h3 class="t"><a :href="`https://www.${r.site}/`" target="_blank" rel="noopener">{{ r.title }}</a></h3>
          <p class="c-abstract">{{ r.abstract }}</p>
          <p class="c-showurl"><span class="c-showurl-text">{{ r.site }}</span></p>
        </div>
      </div>

      <!-- 分页：#page > div > strong + a -->
      <div id="page">
        <div class="page-inner">
          <a v-if="page > 1" class="n" :href="`/s?wd=${encodeURIComponent(wd)}&pn=${(page - 2) * PER_PAGE}`"
             @click.prevent="router.push(pageHref(page - 1))">上一页&lt;</a>
          <strong>{{ page }}</strong>
          <a v-for="p in pageNums" :key="p" :href="`/s?wd=${encodeURIComponent(wd)}&pn=${(p - 1) * PER_PAGE}`"
             @click.prevent="router.push(pageHref(p))">{{ p }}</a>
          <a v-if="page < MAX_PAGES" class="n" :href="`/s?wd=${encodeURIComponent(wd)}&pn=${page * PER_PAGE}`"
             @click.prevent="router.push(pageHref(page + 1))">下一页&gt;</a>
        </div>
      </div>

      <p class="s-teach-tip">
        教学提示：结果项为 <code class="code-inline">h3.t</code> 结构；翻页使用
        <code class="code-inline">//*[@id="page"]/div/a[last()]</code> 定位「下一页」，
        第 {{ MAX_PAGES }} 页后该元素消失，可用来演示 NoSuchElementException。
      </p>
    </div>
  </div>
</template>

<style scoped>
.s-page {
  min-height: 100vh;
  background: #fff;
  font-family: var(--lab-font);
}
/* 顶部 */
.s-topbar {
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 100;
}
.s-topbar-inner {
  display: flex;
  align-items: center;
  gap: 18px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 14px 20px;
}
.s-logo {
  font-size: 26px;
  font-weight: 700;
  color: #2932e1;
  letter-spacing: 3px;
  text-decoration: none;
  flex: 0 0 auto;
}
.s-searchform { flex: 1; max-width: 630px; }
.s-box {
  display: flex;
  border: 2px solid #c4c7ce;
  border-radius: 10px;
  overflow: hidden;
}
.s-box:focus-within { border-color: #4e6ef2; }
.s_ipt {
  flex: 1;
  height: 38px;
  border: none;
  outline: none;
  padding: 0 12px;
  font-size: 14px;
  min-width: 0;
}
.btn {
  height: 42px;
  padding: 0 24px;
  background: #4e6ef2;
  color: #fff;
  font-size: 14px;
  letter-spacing: 1px;
  border: none;
  cursor: pointer;
}
.btn:hover { background: #4662d9; }
.s-user { margin-left: auto; }
.s-login {
  display: inline-block;
  padding: 6px 20px;
  border-radius: 6px;
  background: #4e6ef2;
  color: #fff !important;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
}
/* 结果区 */
.s-result-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 18px 20px 40px;
}
.s-tips {
  color: #9195a1;
  font-size: 12.5px;
  margin: 0 0 14px;
}
.s-results {
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 630px;
}
.result .t {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 6px;
}
.result .t a { color: #2440b3; }
.result .t a:hover { color: #315efb; text-decoration: underline; }
.result .t a:visited { color: #6b31c8; }
.c-abstract {
  color: #333;
  font-size: 14px;
  line-height: 1.75;
  margin: 0 0 4px;
}
.c-showurl { margin: 0; }
.c-showurl-text {
  color: #008000;
  font-size: 12.5px;
  font-family: var(--lab-mono);
}
/* 分页 */
#page {
  margin: 36px 0 12px;
  padding-left: 4px;
}
#page .page-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
#page strong {
  color: #333;
  background: #f5f5f6;
  border: 1px solid #e8e8e8;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 14px;
}
#page a {
  color: #333;
  padding: 4px 12px;
  border: 1px solid #fff;
  border-radius: 6px;
  font-size: 14px;
  text-decoration: none;
}
#page a:hover {
  border-color: #d0d3da;
  background: #f5f5f6;
}
#page a.n {
  min-width: 70px;
  text-align: center;
  font-weight: 500;
}
.s-teach-tip {
  margin-top: 20px;
  font-size: 12px;
  color: #9aa0a6;
  line-height: 1.8;
  max-width: 630px;
}
</style>
