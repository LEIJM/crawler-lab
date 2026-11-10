<script setup>
/**
 * 伪百度首页（/baidu）
 *
 * DOM 契约（对应 notebook 单元格）：
 *   #kw               搜索输入框（send_keys('转本')）
 *   #su               搜索按钮（click()）
 *   #s-top-loginbtn   顶部登录入口（百度自动化表单）
 */
import { ref, onMounted, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { baiduUI, openBaiduLogin, refreshBaiduUser } from '../lib/baidu-ui.js'
import { logoutBaidu } from '../lib/auth.js'

const router = useRouter()
const route = useRoute()
const kw = ref('')

const HOT_LIST = [
  { tag: '热', text: '2026 年专转本报名时间公布', to: '/s?wd=' + encodeURIComponent('专转本') },
  { tag: '新', text: '大数据产业白皮书发布', to: '/s?wd=' + encodeURIComponent('大数据') },
  { tag: '荐', text: 'Selenium 环境搭建避坑指南', to: '/s?wd=' + encodeURIComponent('selenium') },
  { tag: '热', text: 'Python 数据分析学习路线', to: '/s?wd=' + encodeURIComponent('python 数据分析') },
  { tag: '新', text: '人工智能通识课上线', to: '/s?wd=' + encodeURIComponent('人工智能') },
  { tag: '荐', text: '网络爬虫合法合规要点', to: '/s?wd=' + encodeURIComponent('网络爬虫') }
]

function doSearch() {
  const word = kw.value.trim()
  if (!word) return
  router.push({ path: '/s', query: { wd: word, pn: '0' } })
}

function goLogin() {
  if (baiduUI.user) {
    // 已登录：展示简单菜单（退出登录走 cookie 清理，对应 cookies 教学扩展）
    const quit = window.confirm(`当前登录用户：${baiduUI.user.nickname}\n\n确定要退出登录（清除 BDUSS Cookie）吗？`)
    if (quit) {
      logoutBaidu()
      refreshBaiduUser()
    }
    return
  }
  openBaiduLogin()
}

onMounted(() => {
  refreshBaiduUser()
  document.title = '百度一下，你就知道'
  // 支持从地址栏带 wd 参数预填
  if (route.query.wd) kw.value = String(route.query.wd)
})

watchEffect(() => {
  document.title = '百度一下，你就知道'
})
</script>

<template>
  <div class="baidu-page">
    <!-- 顶部导航 -->
    <div class="s-top">
      <div class="s-top-left">
        <a href="javascript:;">新闻</a>
        <a href="javascript:;">hao123</a>
        <a href="javascript:;">地图</a>
        <a href="javascript:;">贴吧</a>
        <a href="javascript:;">视频</a>
        <a href="javascript:;">学术</a>
      </div>
      <div class="s-top-right">
        <a id="s-top-loginbtn" class="s-top-login" href="javascript:;" @click="goLogin">
          <template v-if="baiduUI.user">{{ baiduUI.user.nickname }}</template>
          <template v-else>登录</template>
        </a>
      </div>
    </div>

    <!-- 主体 -->
    <div class="bd-main">
      <h1 class="bd-logo">百度</h1>
      <form class="bd-search-form" @submit.prevent="doSearch">
        <span class="bd-form-box">
          <input id="kw" v-model="kw" class="s_ipt" type="text" name="wd" autocomplete="off"
                 placeholder="请输入搜索内容，如：转本">
          <a href="javascript:;" class="soutu-btn" title="相机搜索（教学站未实现）"></a>
          <input id="su" class="btn" type="submit" value="百度一下">
        </span>
      </form>

      <!-- 百度热榜 -->
      <div class="hot-board">
        <h3 class="hot-title">百度热榜</h3>
        <ul class="hot-list">
          <li v-for="(item, idx) in HOT_LIST" :key="idx">
            <router-link :to="item.to">
              <span class="hot-tag" :class="{ hot: item.tag === '热', new: item.tag === '新', rec: item.tag === '荐' }">{{ item.tag }}</span>
              <span class="hot-text">{{ item.text }}</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- 教学提示（非真实百度样式，帮助学生定位） -->
      <div class="teach-tip">
        教学提示：本页为模拟百度首页，供 Selenium 练习定位
        <code class="code-inline">#kw</code>、<code class="code-inline">#su</code>、<code class="code-inline">#s-top-loginbtn</code>。
        notebook 中 <code class="code-inline">driver.get('https://www.baidu.com/')</code> 请替换为
        <code class="code-inline">driver.get('http://SERVER:PORT/baidu')</code>
      </div>
    </div>

    <footer class="bd-footer">
      <a href="javascript:;">关于百度</a><span class="sep">|</span>
      <a href="javascript:;">About Baidu</a><span class="sep">|</span>
      <a href="javascript:;">使用百度前必读</a><span class="sep">|</span>
      <span>教学模拟站点 · Data221 课程专用</span>
    </footer>
  </div>
</template>

<style scoped>
.baidu-page {
  min-height: 100vh;
  background: #fff;
  font-family: var(--lab-font);
  display: flex;
  flex-direction: column;
}
/* 顶部导航 */
.s-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px 0;
  font-size: 13px;
}
.s-top-left a {
  color: #333;
  margin-right: 22px;
  font-weight: 500;
}
.s-top-left a:hover { color: #315efb; }
.s-top-right { display: flex; align-items: center; gap: 16px; }
.s-top-login {
  display: inline-flex;
  align-items: center;
  padding: 5px 18px;
  border-radius: 6px;
  background: #4e6ef2;
  color: #fff !important;
  font-weight: 500;
  font-size: 13px;
}
.s-top-login:hover { background: #4662d9; }
/* 主体 */
.bd-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 9vh;
}
.bd-logo {
  font-size: 54px;
  color: #2932e1;
  font-weight: 700;
  letter-spacing: 6px;
  margin: 0 0 26px;
  font-family: var(--lab-font);
  text-shadow: 0 2px 2px rgba(0,0,0,0.04);
}
.bd-search-form { width: 640px; max-width: calc(100vw - 40px); }
.bd-form-box {
  display: flex;
  align-items: center;
  border: 2px solid #4e6ef2;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.bd-form-box:focus-within { box-shadow: 0 2px 10px rgba(78, 110, 242, 0.25); }
.s_ipt {
  flex: 1;
  height: 42px;
  border: none;
  outline: none;
  padding: 0 14px;
  font-size: 15px;
  min-width: 0;
}
.soutu-btn {
  width: 34px;
  height: 34px;
  margin-right: 2px;
  background: transparent;
}
#su {
  height: 44px;
  padding: 0 34px;
  background: #4e6ef2;
  color: #fff;
  font-size: 15px;
  letter-spacing: 2px;
  border: none;
  cursor: pointer;
  border-radius: 0 8px 8px 0;
}
#su:hover { background: #4662d9; }
/* 热榜 */
.hot-board {
  margin-top: 46px;
  width: 640px;
  max-width: calc(100vw - 40px);
  border: 1px solid #f1f1f1;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.hot-title {
  font-size: 15px;
  margin: 0 0 10px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}
.hot-title::before {
  content: '';
  width: 4px;
  height: 14px;
  background: #4e6ef2;
  border-radius: 2px;
  display: inline-block;
}
.hot-list { list-style: none; margin: 0; padding: 0; }
.hot-list li { padding: 7px 0; }
.hot-list a { display: flex; align-items: center; gap: 10px; color: #333; }
.hot-list a:hover { color: #315efb; text-decoration: none; }
.hot-tag {
  font-size: 11px;
  color: #fff;
  border-radius: 4px;
  padding: 1px 5px;
  flex: 0 0 auto;
}
.hot-tag.hot { background: #f33; }
.hot-tag.new { background: #ff6a00; }
.hot-tag.rec { background: #a8a8a8; }
.hot-text { font-size: 14px; }
/* 教学提示 */
.teach-tip {
  margin-top: 30px;
  max-width: 720px;
  font-size: 12.5px;
  color: #9aa0a6;
  line-height: 1.8;
  text-align: center;
  padding: 0 12px;
}
/* 页脚 */
.bd-footer {
  padding: 18px 24px;
  text-align: center;
  font-size: 12px;
  color: #9195a1;
  background: #f9f9f9;
}
.bd-footer a { color: #9195a1; margin: 0; }
.bd-footer .sep { margin: 0 10px; color: #ddd; }
</style>
