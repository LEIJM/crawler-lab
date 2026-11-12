import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
// 核心练习页保持同步加载（首屏直达、Selenium 契约稳定）；
// 辅助/文档页懒加载，Vite 自动分包，减小首屏 chunk。
const BaiduHomeView = () => import('../views/BaiduHomeView.vue')
const BaiduResultsView = () => import('../views/BaiduResultsView.vue')
const ShoppingIndexView = () => import('../views/ShoppingIndexView.vue')
const SearchResultsView = () => import('../views/SearchResultsView.vue')
const BookDetailView = () => import('../views/BookDetailView.vue')
const LoginView = () => import('../views/LoginView.vue')
const PlaygroundView = () => import('../views/PlaygroundView.vue')
const ChallengeView = () => import('../views/ChallengeView.vue')
const CaptchaView = () => import('../views/CaptchaView.vue')
const DocsView = () => import('../views/DocsView.vue')

/**
 * 路由设计原则：
 * 1. 伪人邮书城的路径与 notebook 中出现的 URL 完全一致
 *    （/shopping/index、/search?keyword=xx&jc=、/login；/kaptcha.jpg 为服务器接口），
 *    学生只需把 https://www.ptpress.com.cn 换成本站地址即可直接复用 notebook 代码。
 * 2. 伪百度的首页从 / 调整为 /baidu，搜索结果页保持 /s?wd=xx 形态；
 *    站点根路径 / 留给教学总领页面。
 */
const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'Data221 · 爬虫教学实训站', chrome: 'hub' } },
  { path: '/baidu', name: 'baidu-home', component: BaiduHomeView, meta: { title: '百度一下，你就知道', chrome: 'baidu' } },
  { path: '/s', name: 'baidu-results', component: BaiduResultsView, meta: { title: '百度搜索', chrome: 'baidu' } },
  { path: '/shopping/index', name: 'shopping-index', component: ShoppingIndexView, meta: { title: '人民邮电出版社-图书商城', chrome: 'ptpress' } },
  { path: '/shopping/detail', name: 'shopping-detail', component: BookDetailView, meta: { title: '图书详情-人民邮电出版社', chrome: 'ptpress' } },
  { path: '/search', name: 'search', component: SearchResultsView, meta: { title: '搜索结果-人民邮电出版社', chrome: 'ptpress' } },
  { path: '/login', name: 'login', component: LoginView, meta: { title: '会员登录-人民邮电出版社', chrome: 'ptpress' } },
  { path: '/playground', name: 'playground', component: PlaygroundView, meta: { title: '选择器练习场 · Data221 实训站', chrome: 'hub' } },
  { path: '/challenge', name: 'challenge', component: ChallengeView, meta: { title: '爬虫闯关 · Data221 实训站', chrome: 'hub' } },
  { path: '/captcha', name: 'captcha', component: CaptchaView, meta: { title: '验证码练习 · Data221 实训站', chrome: 'hub' } },
  { path: '/docs', name: 'docs', component: DocsView, meta: { title: '教学文档 · Data221 实训站', chrome: 'hub' } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

router.afterEach((to) => {
  // 部分页面（如百度结果页）会在视图内部再次覆写标题
  if (to.meta?.title && document.title !== to.meta.title) {
    document.title = to.meta.title
  }
})

export default router
