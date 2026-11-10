/**
 * 伪人民邮电出版社书城 · 图书数据集
 *
 * 说明：本数据集为教学模拟数据，书名与作者按真实出版社常见品类风格编写，
 * 仅用于 Selenium / requests / BeautifulSoup 爬取练习，不代表真实库存。
 * 封面使用 CSS 渐变色块（零外部图片资源，便于内网离线部署）。
 */

export const BOOKS = [
  // ---- 大数据（notebook 搜索词「大数据」必须命中本组） ----
  { isbn: '9787115532110', title: '大数据导论', author: '林子雨', price: 59.8, category: '大数据', pubDate: '2024-01', pages: 296, intro: '系统介绍大数据基本概念、技术体系与典型应用，配套实训案例与习题。' },
  { isbn: '9787115543215', title: 'Python数据分析与应用（第2版）', author: '黄红梅 张良均', price: 49.8, category: '大数据', pubDate: '2023-09', pages: 272, intro: '从数据获取、清洗到可视化，完整覆盖数据分析全流程，附数据集与源码。' },
  { isbn: '9787115550015', title: 'Hadoop大数据平台构建与实战', author: '李明华', price: 69.8, category: '大数据', pubDate: '2024-03', pages: 356, intro: '以企业真实集群为例讲解 Hadoop 生态搭建、调优与运维。' },
  { isbn: '9787115528809', title: 'Spark大数据处理技术', author: '王伟 陈静', price: 65.0, category: '大数据', pubDate: '2023-06', pages: 332, intro: '涵盖 Spark Core、SQL、Streaming 与机器学习实践。' },
  { isbn: '9787115560020', title: '数据采集与网络爬虫实战', author: '张裕淇', price: 55.0, category: '大数据', pubDate: '2024-06', pages: 284, intro: 'requests、Selenium、Scrapy 三大利器逐章实战，含反爬应对。' },
  { isbn: '9787115561129', title: '大数据可视化技术', author: '赵淑娴', price: 52.0, category: '大数据', pubDate: '2024-08', pages: 260, intro: 'ECharts、D3.js 与 Python 可视化库综合应用，大屏案例剖析。' },

  // ---- 人工智能 ----
  { isbn: '9787115519980', title: '机器学习基础与实践', author: '周志勇', price: 66.0, category: '人工智能', pubDate: '2023-04', pages: 348, intro: '从线性回归到集成学习，公式推导与代码实现并重。' },
  { isbn: '9787115524489', title: '深度学习入门：基于Python的理论与实现', author: '吴子涵', price: 79.8, category: '人工智能', pubDate: '2023-11', pages: 400, intro: '手写反向传播与经典网络，从零理解深度学习原理。' },
  { isbn: '9787115536774', title: '自然语言处理与应用开发', author: '李阳', price: 72.0, category: '人工智能', pubDate: '2024-02', pages: 380, intro: '词向量、预训练模型与文本分类、情感分析项目实战。' },
  { isbn: '9787115545547', title: '计算机视觉项目实战：OpenCV与深度学习', author: '孙磊', price: 89.8, category: '人工智能', pubDate: '2024-05', pages: 424, intro: '从图像基础操作到目标检测完整项目，含工程部署章节。' },
  { isbn: '9787115555447', title: '大语言模型应用开发入门', author: '郑海涛', price: 69.0, category: '人工智能', pubDate: '2025-01', pages: 312, intro: '提示工程、检索增强与智能体应用，快速上手 LLM 开发。' },
  { isbn: '9787115566772', title: 'AI数据标注与训练集构建', author: '何静', price: 45.0, category: '人工智能', pubDate: '2024-10', pages: 220, intro: '面向高职与应用型本科的数据标注岗位技能教程。' },

  // ---- 程序设计 ----
  { isbn: '9787115501120', title: 'Python程序设计基础（第3版）', author: '董付国', price: 49.8, category: '程序设计', pubDate: '2023-03', pages: 300, intro: 'Python 语法体系与典型算法例题，适合零基础入门。' },
  { isbn: '9787115504510', title: 'Java核心技术笔记', author: '马晓东', price: 99.8, category: '程序设计', pubDate: '2023-08', pages: 560, intro: '面向 Java 进阶开发者，聚焦语言核心与并发实践。' },
  { isbn: '9787115512345', title: 'C语言程序设计实训教程', author: '谭浩强 编', price: 39.8, category: '程序设计', pubDate: '2022-12', pages: 268, intro: '经典教材配套实训，上机题目丰富。' },
  { isbn: '9787115516780', title: 'Go语言并发编程实战', author: '钱昊', price: 79.0, category: '程序设计', pubDate: '2024-04', pages: 368, intro: 'goroutine、channel 与常见并发模式详解。' },
  { isbn: '9787115525567', title: 'JavaScript现代编程指南', author: '李松峰', price: 89.0, category: '程序设计', pubDate: '2023-10', pages: 480, intro: '覆盖 ES2023 语法、异步编程与模块工程化。' },
  { isbn: '9787115538000', title: '算法与数据结构（Python语言描述）', author: '严蔚敏 编', price: 59.0, category: '程序设计', pubDate: '2024-07', pages: 320, intro: '经典数据结构的 Python 实现，配可视化图解。' },

  // ---- 数据库与存储 ----
  { isbn: '9787115533326', title: 'MySQL数据库应用与开发', author: '崔慧娟', price: 58.0, category: '数据库与存储', pubDate: '2023-05', pages: 308, intro: '从 SQL 语法到事务与索引优化，配套电商项目库。' },
  { isbn: '9787115540980', title: 'Redis实战：从入门到生产环境', author: '黄文毅', price: 69.0, category: '数据库与存储', pubDate: '2024-01', pages: 340, intro: '五大数据结构与缓存架构模式，附高可用部署方案。' },
  { isbn: '9787115544407', title: 'MongoDB应用设计', author: '唐成', price: 62.0, category: '数据库与存储', pubDate: '2023-12', pages: 296, intro: '文档建模、聚合管道与分布式集群实践。' },
  { isbn: '9787115552280', title: 'PostgreSQL从入门到性能调优', author: '樊飞', price: 75.0, category: '数据库与存储', pubDate: '2024-09', pages: 396, intro: '开源数据库王者指南，执行计划与调优案例丰富。' },
  { isbn: '9787115556219', title: 'SQL进阶面试宝典', author: '面试题研究组', price: 42.0, category: '数据库与存储', pubDate: '2024-06', pages: 240, intro: '300 道高频 SQL 笔试题解析。' },
  { isbn: '9787115560037', title: '数据仓库与数据中台建设', author: '刘峰', price: 82.0, category: '数据库与存储', pubDate: '2025-02', pages: 420, intro: '从数仓分层建模到中台治理的企业实践。' },

  // ---- 网络与安全 ----
  { isbn: '9787115521121', title: '计算机网络基础（第6版）', author: '谢希仁', price: 52.0, category: '网络与安全', pubDate: '2023-02', pages: 356, intro: '经典网课配套教材，OSI 与 TCP/IP 体系完整覆盖。' },
  { isbn: '9787115528892', title: '网络爬虫原理与实践指南', author: '张涛', price: 48.0, category: '网络与安全', pubDate: '2023-07', pages: 256, intro: 'HTTP 协议、会话与验证码识别原理详解。' },
  { isbn: '9787115537775', title: 'Web安全攻防：渗透测试指南', author: '徐焱', price: 99.0, category: '网络与安全', pubDate: '2024-02', pages: 452, intro: 'OWASP Top 10 逐一拆解，靶场环境一键搭建。' },
  { isbn: '9787115546540', title: '密码学基础与加密应用', author: '任伟', price: 56.0, category: '网络与安全', pubDate: '2023-09', pages: 288, intro: '古典密码到国密算法，配套 Python 加解密实验。' },
  { isbn: '9787115552273', title: 'Linux运维与网络安全实战', author: '丁明一', price: 79.8, category: '网络与安全', pubDate: '2024-04', pages: 404, intro: 'CentOS 与 Ubuntu 双平台运维脚本化实践。' },
  { isbn: '9787115562119', title: 'Wireshark网络分析就这么简单', author: '林沛满', price: 69.0, category: '网络与安全', pubDate: '2024-11', pages: 312, intro: '通过真实抓包案例理解协议细节。' },

  // ---- 前端开发 ----
  { isbn: '9787115514472', title: 'HTML5+CSS3网页设计入门', author: '刘晓强', price: 45.0, category: '前端开发', pubDate: '2023-03', pages: 252, intro: '零基础网页布局到响应式站点搭建。' },
  { isbn: '9787115520193', title: 'Vue.js 3前端开发实战', author: '梁灏', price: 79.8, category: '前端开发', pubDate: '2023-08', pages: 388, intro: '组件、路由、状态管理到工程化构建一册通。' },
  { isbn: '9787115528908', title: 'React Hooks开发精解', author: '王松', price: 72.0, category: '前端开发', pubDate: '2024-01', pages: 344, intro: 'Hooks 心智模型与常见陷阱，附性能优化专题。' },
  { isbn: '9787115535559', title: 'TypeScript编程指南', author: '郭文超', price: 68.0, category: '前端开发', pubDate: '2024-03', pages: 352, intro: '类型体操从入门到进阶，工程配置详解。' },
  { isbn: '9787115545635', title: '移动端Web开发实战', author: '黄丹', price: 59.8, category: '前端开发', pubDate: '2024-05', pages: 300, intro: '小程序、H5 与混合应用开发对比实践。' },
  { isbn: '9787115557773', title: '前端自动化测试与Selenium实战', author: '于晶', price: 66.0, category: '前端开发', pubDate: '2025-03', pages: 328, intro: '从单元测试到端到端 UI 自动化测试体系搭建。' },

  // ---- 计算机基础 ----
  { isbn: '9787115507788', title: '大学计算机基础（第8版）', author: '龚沛曾', price: 42.0, category: '计算机基础', pubDate: '2023-01', pages: 264, intro: 'Office 与计算思维公共基础课标准教材。' },
  { isbn: '9787115516797', title: '计算机组装与维护实训', author: '闫俊平', price: 39.8, category: '计算机基础', pubDate: '2023-05', pages: 216, intro: '硬件识别、装机流程与常见故障排除。' },
  { isbn: '9787115528762', title: '操作系统原理与实践', author: '汤小丹', price: 55.0, category: '计算机基础', pubDate: '2023-10', pages: 336, intro: '进程调度、内存管理与文件系统原理详解。' },
  { isbn: '9787115538895', title: '办公自动化高级应用', author: '陈静', price: 49.8, category: '计算机基础', pubDate: '2024-02', pages: 268, intro: 'Excel 函数、宏与 Word 排版自动化进阶。' },
  { isbn: '9787115546656', title: '信息技术（基础模块）', author: '徐雅琴', price: 36.0, category: '计算机基础', pubDate: '2024-06', pages: 200, intro: '职教信息技术新课标配套教材。' },
  { isbn: '9787115558084', title: '数字素养与计算思维导论', author: '战德臣', price: 46.0, category: '计算机基础', pubDate: '2024-09', pages: 248, intro: '面向全体专业学生的数字通识课程读本。' },

  // ---- 软件工程 ----
  { isbn: '9787115528769', title: '软件工程导论（第7版）', author: '张海藩', price: 52.0, category: '软件工程', pubDate: '2023-04', pages: 320, intro: '需求分析到软件测试的经典工程方法体系。' },
  { isbn: '9787115534569', title: 'Git版本控制与团队协作', author: '蒋鑫', price: 59.0, category: '软件工程', pubDate: '2023-11', pages: 296, intro: '从单人开发到大型仓库的分支策略实战。' },
  { isbn: '9787115542216', title: '敏捷开发与DevOps实践', author: '董越', price: 75.0, category: '软件工程', pubDate: '2024-03', pages: 368, intro: '持续集成、持续交付流水线搭建全景。' },
  { isbn: '9787115553322', title: '软件测试技术与项目实战', author: '佟伟光', price: 56.0, category: '软件工程', pubDate: '2024-07', pages: 304, intro: '功能、接口、自动化测试三线并进的实训教程。' },
  { isbn: '9787115558114', title: '产品需求文档写作指南', author: '刘天', price: 42.0, category: '软件工程', pubDate: '2024-10', pages: 228, intro: 'PRD 模板、评审清单与案例复盘。' },
  { isbn: '9787115563451', title: '系统架构设计入门', author: '李智慧', price: 88.0, category: '软件工程', pubDate: '2025-01', pages: 416, intro: '从单体到微服务的架构演进思维训练。' }
]

export const CATEGORIES = ['大数据', '人工智能', '程序设计', '数据库与存储', '网络与安全', '前端开发', '计算机基础', '软件工程']

/** 按关键词过滤图书（标题 / 作者 / 分类 / 简介，忽略大小写） */
export function searchBooks(keyword) {
  const kw = String(keyword || '').trim().toLowerCase()
  if (!kw) return [...BOOKS]
  return BOOKS.filter(b =>
    b.title.toLowerCase().includes(kw) ||
    b.author.toLowerCase().includes(kw) ||
    b.category.toLowerCase().includes(kw) ||
    b.intro.toLowerCase().includes(kw)
  )
}

export function findBook(isbn) {
  return BOOKS.find(b => b.isbn === String(isbn)) || null
}

/** 封面渐变色板（按 ISBN 哈希取色，保证同一本书颜色稳定） */
const COVER_PALETTES = [
  ['#1e3a8a', '#3b82f6'], ['#065f46', '#34d399'], ['#7c2d12', '#f59e0b'],
  ['#5b21b6', '#a78bfa'], ['#9d174d', '#fb7185'], ['#0f766e', '#2dd4bf'],
  ['#92400e', '#fbbf24'], ['#374151', '#9ca3af']
]

export function coverGradient(isbn) {
  let h = 0
  const s = String(isbn)
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const [a, b] = COVER_PALETTES[h % COVER_PALETTES.length]
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`
}
