/**
 * 伪百度搜索结果生成器
 *
 * 教学目标（对应 notebook 第 0 个单元格）：
 * - 任意关键词均可搜索，结果页标题为 `{关键词}_百度搜索`，用于 WebDriverWait(title_contains)；
 * - 结果以 <h3 class="t"> 呈现，分页以 #page>div 内 strong(当前页) + a(页码/上一页/下一页) 呈现；
 * - 结果由 关键词+页码 作为种子确定性生成：同一关键词翻页/重爬结果稳定，便于课堂断言。
 */

/** 字符串哈希 → 32 位整数种子 */
function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/** mulberry32 伪随机数发生器（确定性） */
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 课堂常见关键词的定制结果（更贴近真实搜索体验） */
const CURATED = {
  '转本': [
    { title: '江苏专转本考试网-2026年专转本报名入口', site: 'www.jszzb.edu.cn', abstract: '江苏省普通高校"专转本"选拔考试报名工作即将开始，考生可登录省教育考试院网站进行网上报名……' },
    { title: '专转本考试大纲汇总_各专业类别', site: 'jiaoyu.people.com.cn', abstract: '大学语文、高等数学、英语及专业综合操作考试大纲最新版，含题型结构与分值分布说明。' },
    { title: '2026年专转本报名时间及流程详解', site: 'gaokao.chsi.com.cn', abstract: '网上报名、资格审核、志愿填报、缴费与准考证打印时间安排一览。' },
    { title: '专转本备考经验：从零基础到上岸', site: 'zhuanlan.zhihu.com', abstract: '三轮复习法、真题刷题节奏与错题本整理方法，附复习计划表下载。' },
    { title: '专转本与专升本的区别是什么？', site: 'www.baike.com', abstract: '从招生对象、考试组织、学历性质等维度对比两类升学途径。' }
  ],
  '大数据': [
    { title: '大数据-技术定义与应用场景科普', site: 'baike.com', abstract: '大数据是指无法在一定时间范围内用常规软件工具进行捕捉、管理和处理的数据集合……' },
    { title: '中国大数据产业发展白皮书（2026）', site: 'www.caict.ac.cn', abstract: '报告显示数据要素市场规模持续扩大，行业应用从互联网向制造、政务快速渗透。' },
    { title: '大数据专业就业方向与岗位要求', site: 'www.jobui.com', abstract: '数据工程师、数据分析、数据仓库、BI 等岗位技能要求与薪资区间分析。' },
    { title: '零基础学大数据：学习路线图（2026版）', site: 'www.runoob.com', abstract: '从 Linux、SQL、Java/Python 到 Hadoop、Spark 的系统学习路径建议。' },
    { title: '高校大数据实训平台建设案例', site: 'www.edu.cn', abstract: '校企合作共建实训环境，覆盖采集、存储、清洗、分析、可视化全流程。' }
  ],
  'selenium': [
    { title: 'Selenium官方网站-Web浏览器自动化', site: 'www.selenium.dev', abstract: 'Selenium is an umbrella project for a range of tools and libraries that enable and support the automation of web browsers.' },
    { title: 'Selenium Python文档-元素定位与等待', site: 'selenium-python.readthedocs.io', abstract: 'By、XPath、CSS 选择器定位方式详解，显式等待 WebDriverWait 用法示例。' },
    { title: 'Selenium爬虫实战教程（含反爬应对）', site: 'cuiqingcai.com', abstract: '从环境搭建到窗口切换、验证码识别的综合案例集。' },
    { title: 'Selenium常见报错速查表', site: 'stackoverflow.com', abstract: 'NoSuchElementException、TimeoutException 等异常成因与排查思路。' },
    { title: 'chromedriver镜像下载与版本匹配', site: 'registry.npmmirror.com', abstract: 'Chrome 浏览器版本与 driver 对应关系说明及国内镜像下载地址。' }
  ]
}

/** 通用标题模板（任意关键词） */
const TITLE_TEMPLATES = [
  '{kw}最新政策解读_行业动态',
  '{kw}是什么？一篇文章看懂',
  '{kw}报名条件及流程详解_2026',
  '{kw}考试科目与大纲一览_教育培训',
  '{kw}历年真题及答案解析下载',
  '{kw}备考攻略：三轮复习法超详细',
  '{kw}和普通本科有什么区别？',
  '{kw}通过率数据统计分析',
  '{kw}培训哪家强？过来人真实经验分享',
  '{kw}报名时间及入口_官方发布',
  '关于{kw}的十个高频问题解答',
  '{kw}职业发展路径与薪资水平',
  '{kw}入门到精通学习路线图',
  '{kw}资源合集（持续更新）'
]

const SITES = [
  'www.zhihu.com', 'www.sohu.com', 'www.people.com.cn', 'www.edu.cn',
  'baike.com', 'www.xinhuanet.com', 'www.bilibili.com', 'www.runoob.com',
  'www.csdn.net', 'www.jianshu.com', 'weibo.com', 'www.chsi.com.cn'
]

const ABSTRACT_OPENERS = [
  '本文系统梳理了', '一文读懂', '深度解析：', '速看：', '官方发布：', '权威解读',
  '超详细整理：', '新手必读：', '最新消息：', '完整指南：', '案例分析：', '数据报告：'
]
const ABSTRACT_CLOSERS = [
  '建议收藏备查。', '更多内容可访问官网查看。', '附完整资料下载方式。',
  '适合新手同学入门参考。', '欢迎评论区交流讨论。', '更新时间：本周。',
  '内容持续更新中。', '点击查看详情。'
]

const RESULTS_PER_PAGE = 10
export const MAX_PAGES = 10

/** 生成某关键词某页（从 1 开始）的搜索结果 */
export function generateResults(kw, page) {
  const keyword = String(kw || '').trim() || '百度搜索'
  const p = Math.min(Math.max(1, Number(page) || 1), MAX_PAGES)
  const rand = mulberry32(hashSeed(keyword + '#' + p))
  const curated = CURATED[keyword.toLowerCase()] || []
  const out = []
  for (let i = 0; i < RESULTS_PER_PAGE; i++) {
    const globalIndex = (p - 1) * RESULTS_PER_PAGE + i
    // 前两页混入定制结果（若有），其余使用模板生成
    if (globalIndex < curated.length) {
      const c = curated[globalIndex]
      out.push({ title: c.title, site: c.site, abstract: c.abstract })
      continue
    }
    const tpl = TITLE_TEMPLATES[Math.floor(rand() * TITLE_TEMPLATES.length)]
    const site = SITES[Math.floor(rand() * SITES.length)]
    const opener = ABSTRACT_OPENERS[Math.floor(rand() * ABSTRACT_OPENERS.length)]
    const closer = ABSTRACT_CLOSERS[Math.floor(rand() * ABSTRACT_CLOSERS.length)]
    out.push({
      title: tpl.replace('{kw}', keyword),
      site,
      abstract: `${opener}${keyword}的核心要点、常见误区与实操步骤，${closer}`
    })
  }
  return out
}
