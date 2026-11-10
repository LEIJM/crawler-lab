# Changelog

所有显著变更记录于此。版本遵循语义化版本号。

## [1.0.2] - 2026-11-10

### 新增

- **Cloudflare Workers / Pages 托管**：`wrangler.jsonc` 以 Worker + 静态资源部署 SPA 与课程接口；
  `wrangler.pages.jsonc` + `functions/_middleware.js` + `public/_redirects` 支持 Pages。
  命令：`npm run deploy`、`npm run deploy:pages`。
- 接口层改为 Fetch API（`server/api.js`），Node 服务器、Vite 开发中间件与边缘运行时共用。
- 验证码会话改为 AES-GCM 无状态令牌（`RYSESSID` / `cid`），适配 Workers 无共享内存的约束。

## [1.0.1] - 2026-11-10

### 修复

- **开发模式下验证码/接口不可用（ECONNREFUSED）**：此前 `npm run dev` 需另开终端运行
  `node server/server.js`，否则 Vite 代理转发 `/api`、`/kaptcha.jpg` 会全部连接拒绝。
  现重构 `server.js` 导出统一的 `handleApi(req,res)` 接口分发函数，并在 `vite.config.js`
  中以插件形式挂载为开发服务器中间件——**`npm run dev` 单命令即可完整使用全部接口**，
  代理配置已移除，问题根除；`node server/server.js` 生产模式行为不变（同一套接口逻辑）。

### 验证

- 开发模式（5173）：`/api/health`、`/kaptcha.jpg`（含 RYSESSID 下发）、`POST /api/captcha/new`、
  `POST /login` 全通道验证；浏览器 E2E 登录成功并跳转书城首页（欢迎你，student）。
- 确定性机制测试（固定验证码串）：正确码/错误码/无会话三分支响应全部符合预期。
- 生产模式（8188）重构后回归：健康检查、验证码、`/login`、`/s` 页面全部正常；自检 11/11。

## [1.0.0] - 2026-11-09

### 新增

- **总领页** `/`：课程导航、notebook 单元格 ↔ 页面对照表、快速开始三步指引、服务状态概览。
- **伪百度套件**：
  - `/baidu` 首页，复刻 `#kw` 搜索框、`#su` 按钮与顶部 `#s-top-loginbtn` 登录入口；
  - `/s` 结果页，标题为 `{关键词}_百度搜索`（满足 `WebDriverWait(title_contains)`），
    结果为 `h3.t` 结构，分页 `#page > div > strong + a`，`a[last()]` 为"下一页"，
    第 10 页后"下一页"消失（复刻真实站点，可用于讲解 NoSuchElementException）；
  - Tangram 风格登录弹窗，含 `#TANGRAM__PSP_11__userName / password / isAgree / submit / error`
    全部 ID 契约，登录成功下发 `BAIDUID` / `BDUSS` Cookie 支持单元格 14 的 Cookies 注入练习。
- **伪人邮书城套件**：
  - `/shopping/index` 书城首页，头部层级严格满足
    `//*[@id="header"]/div[1]/div/div[2]/div[3]/input|button` 契约；
  - 搜索按钮 `window.open` **新窗口**打开 `/search?keyword=xx&jc=`（对应 `switch_to.window`），
    结果书名满足 `.book_item > a > p`；
  - `/shopping/detail` 图书详情页（结构化数据延伸练习）；
  - `/login` 登录页：`#loginForm` 三段式 XPath 契约 + `.verCodeImg` 元素截图目标 + `#loginBtn`，
    登录接口 `POST /login` 与 notebook 单元格 8 的 requests 流程共用。
- **实训功能页**：
  - `/playground` 选择器练习场（CSS / XPath 实时查询 + 高亮 + notebook 预置选择器）；
  - `/challenge` 爬虫闯关 6 关（静态列表 / 异步加载 / 点击展开 / 分页表格 / 编码解码 / 请求头反爬），
    暗号答案仅存于服务端；
  - `/captcha` 验证码识读练习（cid 绑定、无限刷新、即时校验、正确率统计 + requests 参考代码）；
  - `/docs` 教学文档（站点地图、账号、API 契约、部署指南、合规说明）。
- **零依赖 Node 服务器** `server/server.js`：
  - 静态托管 `dist/` + history 路由回退（深链接直达 SPA）；
  - `GET /kaptcha.jpg` 验证码图片（Session 绑定，`Set-Cookie: RYSESSID`，10 分钟有效）；
  - `POST /login` 表单登录（验证码校验、一次性消费、成功下发 `ryName` / `ryToken`）；
  - `POST /api/baidu/login`、`/api/captcha/new|verify`、`/api/challenge/check|secret`、`/api/health`；
  - `--selftest` 自检模式（CRC32 标准向量、PNG 结构、会话与登录逻辑等 11 项）。
- **纯手写 PNG 验证码生成器** `server/captcha.js`：CRC32 + zlib + 七段数码管字形，
  4 位数字、随机颜色/抖动/干扰线，AI 视觉逐张识读 7/7 全对。
- **教学数据**：48 本虚构图书（8 大类）、确定性生成的百度搜索结果（同关键词结果稳定）。

### 修复（验收过程中发现并解决）

- 百度结果页翻页时 `computed` 值未变导致标题不更新：改用 `watch(route.fullPath, { immediate: true })`。
- 闯关第 5 关 `btoa()` 编码中文字符串抛 `InvalidCharacterError`：改为编码纯 ASCII 串。

### 验收

- Vite 构建零错误零警告；服务器自检 11/11；Playwright 全量契约验收通过（详见 README「验收记录」）。
