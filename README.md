# Data221 · Selenium 自动化爬取教学实训站

> 配套课程《Data221 · selenium 自动化爬取》（`0103-Data221selenium自动化爬取.ipynb`）的可部署模拟站点。
> 原 notebook 练习页面已失效，本站按原代码的**定位契约（XPath / CSS / URL / Session）**重建了全部目标页面，
> 学生只需把 notebook 里的域名替换为本站地址，**其余代码一行不用改**。

## 项目组成

| 部分 | 说明 |
|---|---|
| `src/` | Vue 3 + Vue Router 4 前端（Vite 8 构建），11 个功能页面 |
| `server/api.js` | 课程接口（Fetch API），Node / Workers / Pages 共用 |
| `server/server.js` | **零依赖** Node 服务器（仅内置模块），托管 `dist/` 并适配接口 |
| `server/captcha.js` | 纯手写 PNG 验证码生成器（CRC32 + zlib + 七段数码管字形），对应 `/kaptcha.jpg` |
| `worker/` | Cloudflare Workers 入口（静态资源 + 接口） |
| `functions/` | Cloudflare Pages Functions（与 Worker 同一套接口） |
| `dist/` | `npm run build` 产物（部署时随 server 一起拷贝即可） |

## 快速开始

```bash
npm install        # 首次
npm run build      # 构建前端到 dist/
npm run serve      # 启动服务器，默认端口 8188（PORT=80 可覆盖）
```

- 总领页：`http://localhost:8188/`
- 自检：`npm run selftest`（11 项内部检查：CRC32 向量、PNG 结构、会话逻辑等）

**开发模式（单命令）**：`npm run dev` 即可完整使用（验证码 / 登录 / 闯关接口已通过 Vite 插件
内置到开发服务器，无需另开终端、无代理依赖），打开 `http://localhost:5173`。

**内网离线部署**：服务器零外部依赖，在联网机器完成 `npm install && npm run build` 后，
只需把 `dist/` 和 `server/` 拷贝到内网服务器，执行 `node server/server.js` 即可。

**Cloudflare Workers / Pages**：

```bash
npx wrangler login          # 首次：登录 Cloudflare
npm run deploy              # Workers（推荐）：构建 dist/ 并 wrangler deploy
npm run deploy:pages        # Pages：构建 dist/，上传静态资源并启用 functions/
```

- Workers：`wrangler.jsonc`（`assets` + Worker），SPA 深链接由 `not_found_handling` 回退到 `index.html`，`/api/*`、`/kaptcha.jpg`、`POST /login` 走 Worker。
- Pages：构建输出 `dist/`，由 Pages 默认 SPA 回退处理深链接，`functions/_middleware.js` 处理接口（`wrangler.pages.jsonc`）。
- 验证码会话改为 AES-GCM 令牌（Cookie / cid），不依赖进程内存，可在边缘多实例上使用。可选环境变量 `CAPTCHA_SECRET` 覆盖默认密钥。

## 页面与 notebook 对照

| notebook 单元格 | 原地址 | 替换为 |
|---|---|---|
| 单元格 0 百度搜索爬取 | `https://www.baidu.com/` | `https://crawler-lab.030516.xyz/baidu` |
| 单元格 2 人邮书城搜索 | `https://www.ptpress.com.cn/shopping/index` | `https://crawler-lab.030516.xyz/shopping/index`（仅换域名） |
| 单元格 4/5 识别验证码 | `https://www.ptpress.com.cn/kaptcha.jpg` | `https://crawler-lab.030516.xyz/kaptcha.jpg`（仅换域名） |
| 单元格 8 模拟登录 | `POST https://www.ptpress.com.cn/login` | `POST https://crawler-lab.030516.xyz/login`（仅换域名） |
| 单元格 10 自动化提交表单 | `https://www.ptpress.com.cn/login` | `https://crawler-lab.030516.xyz/login`（仅换域名） |
| 单元格 12 百度自动化表单 | `https://www.baidu.com/` | `https://crawler-lab.030516.xyz/baidu` |
| 单元格 14 百度 Cookies 登录 | `https://www.baidu.com/` | `https://crawler-lab.030516.xyz/baidu` |

**教学账号**（模拟站公开账号）：

| 用户名 | 密码 | 用途 |
|---|---|---|
| `student` | `123456` | 学生账号（人邮 + 百度通用） |
| `teacher` | `888888` | 教师账号 |

## 核心 DOM 契约（与 notebook 代码严格一致）

```
#kw                       百度搜索框        By.XPATH '//*[@id="kw"]'
#su                       百度搜索按钮       By.XPATH '//*[@id="su"]'
h3.t                      百度结果标题       By.CSS_SELECTOR 'h3.t'
#page > div > a[last()]   百度"下一页"      By.XPATH '//*[@id="page"]/div/a[last()]'
#TANGRAM__PSP_11__userName / password / isAgree / submit   百度登录弹窗
//*[@id="header"]/div[1]/div/div[2]/div[3]/input | button   人邮搜索框/按钮
.book_item > a > p        人邮书名（BS4 select）
#loginForm/div[1]/input、div[2]/input、div[3]/div[1]/div/input   登录表单
.verCodeImg               验证码图片（可 screenshot_as_png）
#loginBtn                 登录按钮
```

> 注意：`/kaptcha.jpg` 的文件扩展名沿袭原站，**内容为标准 PNG**（PIL / matplotlib 按文件头自动识别，
> `plt.imread('./kaptcha.jpg')` 可直接读取）。

## 功能页面一览

- `/` 总领页（课程导航 + 对照表 + 快速开始）
- `/baidu`、`/s?wd=xx&pn=0` 伪百度首页 / 结果页（10 页结果、末页无"下一页"→ 注意末页 `a[last()]` 命中的是"上一页"，盲目循环会陷入往返；正确写法是先 `find_elements` 检查"下一页"是否存在）
- `/shopping/index`、`/search?keyword=xx&jc=`、`/shopping/detail?isbn=xx`、`/login` 伪人邮书城
- `/playground` 选择器练习场（CSS / XPath 实时高亮验证）
- `/challenge` 爬虫闯关 6 关（静态 → 异步 → 点击 → 翻页 → 解码 → 请求头反爬；答案存服务端）
- `/captcha` 验证码识读练习（cid 机制，可反复刷、即时校验、正确率统计）
- `/docs` 教学文档（站点地图 / 账号 / API 契约 / 常见报错 / 合规；部署指南见本 README）

## 技术说明

- 前端：Vue 3.5 + Vue Router 4 + Vite 8（rolldown 构建），无 UI 框架依赖，无外部图片/字体资源，可完全离线运行
- 后端：Node ≥ 18，仅 `http` / `fs` / `path` / `crypto` / `zlib` 内置模块；Cloudflare 部署时 Worker 开启 `nodejs_compat` 以复用 PNG 生成器
- 验证码：4 位数字、七段数码管字形、随机颜色/抖动/干扰线，`RYSESSID` 会话绑定（登录）与 `cid` 绑定（练习）双机制
- 登录态：人邮 `ryName` / `ryToken`；百度 `BAIDUID` / `BDUSS`（base64(username) 编码，可解码显示昵称），
  两者均可用 `driver.add_cookie()` 注入完成 Cookies 登录练习
- 合规：本站为教学模拟环境，数据均为程序生成，应部署于内网/教学专用服务器；爬取真实站点请遵守
  robots 协议与服务条款

## 验收记录

- 服务器自检 11/11 通过（CRC32 标准向量、PNG IHDR/IDAT 结构、会话读写等）
- 验证码视觉可读性 7/7 全对（AI 视觉模型逐张识读，含登录页、练习页、curl 下载三种来源）
- Playwright 全量契约验收：
  - 百度：`#kw/#su/#s-top-loginbtn` 定位、搜索后标题 `转本_百度搜索`、`h3.t`×10、
    `a[last()]` 翻页至第 10 页后消失（复刻真实站点行为）
  - 百度登录弹窗 5 个 TANGRAM ID、E2E 登录成功、Cookies 注入后显示登录态
  - 人邮：头部双层 XPath 契约、搜索**新窗口**打开 `?keyword=…&jc=`、`.book_item > a > p` 抓取 7 本书名
  - 登录页三段式 XPath、`.verCodeImg` 元素截图 + 人工识读 + `#loginBtn` 登录成功跳转
  - requests.Session 流程（curl cookie jar 复现）：验证码失效/错误/成功三种响应、验证码一次性消费
  - 练习场、闯关 6 关、验证码练习、文档页、404 重定向全部交互通过，控制台无错误
