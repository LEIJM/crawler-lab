#!/usr/bin/env node
/**
 * scripts/gen-homework-pages.mjs
 *
 * 生成《Data221》课程「作业靶站」四主题静态 HTML：
 *   A 微信公众号排行榜   → public/JS001/open/show/weixindata.html
 *   B 电影票房（某日）    → public/JS001/open/show/box_office_on_a_certain_day.html
 *   C 招聘网站（列表+详情）→ public/JS001/open/show/zhaopin/index{,_2,_3,_4}.html + jobs/{id}.html
 *   D 美食热门榜         → public/JS001/open/show/food/restaurant_list.html
 *
 * 设计约束（见 作业/作业主题扩展开发计划.md）：
 * - 作业代码使用 requests + BeautifulSoup 直接解析 HTML，
 *   页面必须是服务端返回的完整静态文档（不能用 Vue SPA 渲染）。
 * - DOM 契约与 作业/ 下四份参考代码严格一致，学生只替换域名即可运行。
 * - 无外部资源（离线可用），内联样式，顶部带教学模拟免责条。
 *
 * 数据全部为程序生成的虚构数据，仅用于教学。
 * 用法：node scripts/gen-homework-pages.mjs  （或 npm run gen:homework）
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'JS001', 'open', 'show')

/** HTML 转义（属性与文本通用；<0.1% 之类必须转义后才能出现在源码中） */
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/* ------------------------------------------------------------------ */
/* 页面文档骨架：免责条 + 零外部依赖（离线可开）                          */
/* 每个主题有自己的高仿真站点样式（见各 STYLE_* 常量）                    */
/* ------------------------------------------------------------------ */
function shell({ title, subtitle, body, style }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
${style}
</style>
</head>
<body>
<div class="banner">教学模拟环境 · 数据为程序生成的虚构数据，仅用于《Data221》课程实训，与任何真实站点无数据关联</div>
${body}
</body>
</html>
`
}

/* 新榜/清博指数 风（主题 A：微信公众号排行榜） */
const STYLE_WEIXIN = `
body { font: 14px/1.65 "Microsoft YaHei", "PingFang SC", sans-serif; color: #333; background: #f0f2f5; }
.banner { background: #1f2937; color: #e5e7eb; font-size: 12.5px; padding: 7px 16px; text-align: center; }
.wx-nav { background: #fff; border-bottom: 1px solid #e6e8eb; }
.wx-nav-in { max-width: 1080px; margin: 0 auto; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
.wx-logo { background: #07c160; color: #fff; font-weight: 700; font-size: 16px; padding: 5px 12px; border-radius: 6px; letter-spacing: 1px; }
.wx-nav-in h1 { font-size: 17px; color: #1a1a1a; }
.wx-main { max-width: 1080px; margin: 18px auto 48px; padding: 0 16px; }
.wx-crumb { color: #999; font-size: 12.5px; margin-bottom: 10px; }
.wx-crumb b { color: #07c160; }
.wx-card { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.05); overflow: hidden; }
.wx-tabs { display: flex; border-bottom: 2px solid #07c160; background: #fafafa; }
.wx-tabs span { padding: 11px 22px; font-size: 14px; color: #666; }
.wx-tabs span.on { background: #07c160; color: #fff; font-weight: 600; }
.wx-sub { padding: 10px 16px; color: #888; font-size: 12.5px; border-bottom: 1px dashed #ececec; }
table { width: 100%; border-collapse: collapse; }
th { background: #f7f8fa; color: #666; font-weight: 600; font-size: 12.5px; padding: 9px 8px; border-bottom: 1px solid #ececec; }
td { padding: 10px 8px; text-align: center; font-size: 13px; border-bottom: 1px solid #f2f3f5; }
tbody tr:hover td { background: #f6fef9; }
td.num { font-variant-numeric: tabular-nums; }
td.hot { color: #fa5151; font-weight: 700; }
td.fans { color: #07c160; font-weight: 600; }
.wx-note { margin-top: 14px; font-size: 12.5px; color: #888; background: #fff; border: 1px dashed #dcdfe3; border-radius: 8px; padding: 10px 14px; }
`

/* 猫眼专业版 风（主题 B：电影票房排行榜） */
const STYLE_MAOMEN = `
body { font: 14px/1.65 "Microsoft YaHei", "PingFang SC", sans-serif; color: #333; background: #fff; }
.banner { background: #1f2937; color: #9ca3af; font-size: 12.5px; padding: 7px 16px; text-align: center; }
.my-header { background: #1f2937; color: #fff; }
.my-header-in { max-width: 980px; margin: 0 auto; padding: 18px 16px 16px; }
.my-header-in .kicker { color: #f87171; font-size: 12.5px; font-weight: 600; letter-spacing: 2px; }
.my-header-in h1 { font-size: 22px; margin: 2px 0 4px; font-weight: 700; }
.my-header-in .date { color: #9ca3af; font-size: 12.5px; }
.my-main { max-width: 980px; margin: 0 auto; padding: 20px 16px 48px; }
.my-crumb { color: #9ca3af; font-size: 12.5px; margin-bottom: 12px; }
.my-crumb b { color: #f87171; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; color: #9ca3af; font-weight: 500; font-size: 12.5px; padding: 8px 12px; border-bottom: 2px solid #f3f4f6; }
tr.my-row:hover td { background: #fafafa; }
td { padding: 14px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.my-rank { display: inline-flex; width: 26px; height: 26px; border-radius: 4px; background: #f3f4f6; color: #9ca3af; font-style: normal; font-weight: 700; align-items: center; justify-content: center; font-size: 13px; margin: 0 auto; }
.my-rank.r1 { background: #f87171; color: #fff; }
.my-rank.r2 { background: #fb923c; color: #fff; }
.my-rank.r3 { background: #fbbf24; color: #fff; }
.movie-name { font-size: 16px; font-weight: 700; color: #1f2937; display: inline-block; margin-right: 10px; }
.releaseInfo { display: inline-block; color: #9ca3af; font-size: 12px; background: #f3f4f6; border-radius: 999px; padding: 2px 10px; }
.boxDesc-wrap { display: inline-block; font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
.red-color { color: #f87171; }
.my-unit { color: #9ca3af; font-size: 12px; margin-left: 2px; }
.countRate-wrap { display: inline-block; font-size: 14px; font-weight: 600; color: #374151; font-variant-numeric: tabular-nums; margin-right: 8px; }
.my-bar { display: inline-block; width: 90px; height: 6px; background: #f3f4f6; border-radius: 999px; overflow: hidden; vertical-align: middle; }
.my-bar i { display: block; height: 100%; background: linear-gradient(90deg,#fb923c,#f87171); border-radius: 999px; }
.my-note { margin-top: 16px; font-size: 12.5px; color: #9ca3af; background: #f9fafb; border: 1px dashed #e5e7eb; border-radius: 8px; padding: 10px 14px; }
`

/* 拉勾网 风（主题 C：招聘网站） */
const STYLE_LAGOU = `
body { font: 14px/1.65 "Microsoft YaHei", "PingFang SC", sans-serif; color: #333; background: #fff; }
.banner { background: #1f2937; color: #9ca3af; font-size: 12.5px; padding: 7px 16px; text-align: center; }
.lg-nav { background: #00b38a; }
.lg-nav-in { max-width: 1024px; margin: 0 auto; padding: 12px 16px; display: flex; align-items: center; gap: 10px; }
.lg-logo { color: #fff; font-weight: 800; font-size: 20px; letter-spacing: 2px; }
.lg-slogan { color: rgba(255,255,255,.85); font-size: 12.5px; }
.lg-search { margin-left: auto; background: #fff; border-radius: 4px; padding: 6px 14px; font-size: 12.5px; color: #999; width: 260px; }
.lg-main { max-width: 1024px; margin: 18px auto 48px; padding: 0 16px; }
.lg-crumb { color: #999; font-size: 12.5px; margin-bottom: 12px; }
.lg-crumb b { color: #00b38a; }
#s_position_list ul { list-style: none; }
#s_position_list li { background: #fff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,.05); padding: 16px 20px; margin-bottom: 12px; display: flex; align-items: center; gap: 14px; border: 1px solid #f0f0f0; }
#s_position_list li:hover { border-color: #00b38a; }
#s_position_list a { color: #1f2937; font-size: 16px; font-weight: 600; text-decoration: none; }
#s_position_list a:hover { color: #00b38a; }
#s_position_list em { font-style: normal; color: #999; font-size: 13px; }
#s_position_list .salary { color: #fb6037; font-size: 16px; font-weight: 700; margin-left: auto; font-variant-numeric: tabular-nums; }
.lg-pager { margin: 18px 0; text-align: center; font-size: 13px; color: #666; }
.lg-pager a { color: #00b38a; text-decoration: none; margin: 0 8px; }
.lg-detail-head { padding: 26px 0 20px; border-bottom: 1px solid #e8e8e8; }
.lg-detail-head h1 { font-size: 24px; color: #1f2937; }
.lg-detail-head .salary { color: #fb6037; font-size: 20px; font-weight: 700; margin-left: 12px; }
.job-detail { margin-top: 10px; }
.job-detail dd.job_request h3 { font-size: 14px; font-weight: 400; color: #666; }
.job-detail dd.job_request h3 span { margin-right: 16px; }
.job-detail dd.job_request h3 span.salary { color: #fb6037; font-size: 16px; font-weight: 700; }
.lg-tags { margin-top: 10px; color: #666; font-size: 13px; }
.lg-tags h3 span { margin-right: 14px; }
.lg-sec { margin-top: 22px; }
.lg-sec h2 { font-size: 16px; color: #1f2937; margin-bottom: 8px; }
.lg-sec p, .lg-sec dd { color: #555; font-size: 13.5px; line-height: 1.9; }
.lg-company-bar { margin-top: 24px; background: #f6fffb; border: 1px solid #cceee2; border-radius: 8px; padding: 14px 18px; }
.lg-note { margin-top: 16px; font-size: 12.5px; color: #999; background: #fff; border: 1px dashed #e0e0e0; border-radius: 8px; padding: 10px 14px; }
`

/* 大众点评 风（主题 D：美食热门榜） */
const STYLE_DIANPING = `
body { font: 14px/1.65 "Microsoft YaHei", "PingFang SC", sans-serif; color: #333; background: #fff; }
.banner { background: #1f2937; color: #9ca3af; font-size: 12.5px; padding: 7px 16px; text-align: center; }
.dp-header { background: linear-gradient(135deg,#ff6633,#ff8e4f); color: #fff; }
.dp-header-in { max-width: 980px; margin: 0 auto; padding: 22px 16px 20px; }
.dp-header-in .kicker { font-size: 12.5px; opacity: .9; letter-spacing: 2px; }
.dp-header-in h1 { font-size: 24px; margin: 2px 0 4px; font-weight: 800; }
.dp-header-in .date { font-size: 12.5px; opacity: .85; }
.dp-main { max-width: 980px; margin: 0 auto; padding: 18px 16px 48px; }
.dp-crumb { color: #999; font-size: 12.5px; margin-bottom: 12px; }
.dp-crumb b { color: #ff6633; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; color: #999; font-weight: 600; font-size: 12.5px; padding: 10px 10px; border-bottom: 2px solid #ffe3d6; }
td { padding: 13px 10px; border-bottom: 1px solid #f5f5f5; font-size: 13.5px; vertical-align: middle; }
tbody tr:hover td { background: #fff8f5; }
.dp-rank { display: inline-flex; width: 24px; height: 24px; border-radius: 4px; background: #f5f5f5; color: #aaa; font-style: normal; font-weight: 700; align-items: center; justify-content: center; font-size: 12px; }
.dp-rank.r1 { background: #ff6633; color: #fff; }
.dp-rank.r2 { background: #ff8e4f; color: #fff; }
.dp-rank.r3 { background: #ffb37c; color: #fff; }
.shop-name { font-weight: 700; color: #222; }
.dp-cuisine { color: #999; font-size: 12.5px; }
.dp-avg { font-weight: 700; color: #333; font-variant-numeric: tabular-nums; }
.dp-score { color: #ff6633; font-weight: 800; font-size: 15px; font-variant-numeric: tabular-nums; }
.dp-star { color: #ffb800; font-size: 12px; letter-spacing: 1px; }
.dp-cmt { color: #666; font-variant-numeric: tabular-nums; }
.dp-addr { color: #999; font-size: 12.5px; }
.dp-note { margin-top: 14px; font-size: 12.5px; color: #999; background: #fff; border: 1px dashed #ffd9c4; border-radius: 8px; padding: 10px 14px; }
`

/* ------------------------------------------------------------------ */
/* 主题 A：微信公众号原创排行榜（20 行）                                 */
/* ------------------------------------------------------------------ */
/**
 * 列（td 索引与作业代码一致，不可变动）：
 *  0 排名 | 1 公众号名称(span) | 2 微信号 | 3 预估活跃粉丝
 *  4 头条平均阅读 | 5 头条最高阅读 | 6 头条平均在看 | 7 原创平均阅读 | 8 原创篇数
 * 边界样本约定：
 *  - 占豪（YES：10万+ / 10万+ / 285万）
 *  - 人民日报（NO：粉丝 532万 ≥ 300万）
 *  - 视觉志（YES：纯数字 92000 / 81000 双双越过阈值）
 *  - 丁香医生（NO：纯数字 85623 ≤ 90000）
 *  - 央视新闻（NO：原创 68800 ≤ 80000）
 */
const WEIXIN = [
  [1, '占豪', 'zhanhao365', '285万', '10万+', '100万+', '8600', '10万+', '96'],
  [2, '人民日报', 'rmrbwx', '532万', '10万+', '100万+', '12000', '10万+', '120'],
  [3, '央视新闻', 'cctvnewscenter', '498万', '10万+', '100万+', '9800', '68800', '88'],
  [4, '视觉志', 'iiidaily', '150万', '92000', '99800', '4300', '81000', '76'],
  [5, '丁香医生', 'DingXiangYiSheng', '205万', '85623', '96400', '5100', '72400', '65'],
  [6, '十点读书', 'duhaoshu', '288万', '10万+', '100万+', '6200', '9万+', '102'],
  [7, '洞见', 'DJ00123987', '312万', '10万+', '100万+', '5400', '9万+', '95'],
  [8, '夜听', 'yetangongzhong', '296万', '95000', '99800', '4800', '88000', '84'],
  [9, '冯站长之家', 'fzzzgzh', '178万', '8万+', '96400', '3900', '73000', '70'],
  [10, '青年文摘', 'qnwzwx', '126万', '78000', '92100', '3500', '66500', '58'],
  [11, '读者', 'duzheweixin', '340万', '10万+', '100万+', '4700', '9万+', '91'],
  [12, '新华社', 'xinhuashefabu1', '468万', '10万+', '100万+', '8800', '75200', '80'],
  [13, '拾遗', 'shiyi201633', '88万', '68000', '85300', '2900', '59400', '47'],
  [14, '国馆', 'guoguan5000', '105万', '74000', '88600', '3100', '63800', '52'],
  [15, '槽值', 'caozhi163', '132万', '81200', '94500', '3600', '70100', '61'],
  [16, '三联生活周刊', 'lifeweek', '210万', '9万+', '98700', '4200', '8万+', '68'],
  [17, '王耳朵先生', 'huangezishiba', '95万', '66000', '82900', '2700', '57300', '43'],
  [18, '艾菲的理想', 'aifeiideal', '42万', '52000', '68700', '1900', '45600', '35'],
  [19, '末那大叔', 'monadashu77', '156万', '83400', '96800', '4000', '71800', '63'],
  [20, '一星期一本书', 'ydushu', '118万', '71500', '86900', '3000', '61200', '49'],
]

function genWeixin() {
  const rows = WEIXIN.map(
    (r) =>
      `  <tr><td><i class="wx-rank${r[0] <= 3 ? ' top' : ''}">${r[0]}</i></td>` +
      `<td><span class="wx-name">${esc(r[1])}</span></td><td>${esc(r[2])}</td>` +
      `<td class="num fans">${esc(r[3])}</td>` +
      `<td class="num${r[4] === '10万+' ? ' hot' : ''}">${esc(r[4])}</td>` +
      `<td class="num${r[5] === '100万+' ? ' hot' : ''}">${esc(r[5])}</td>` +
      `<td class="num">${esc(r[6])}</td>` +
      `<td class="num${r[7] === '10万+' ? ' hot' : ''}">${esc(r[7])}</td>` +
      `<td class="num">${esc(r[8])}</td></tr>`
  ).join('\n')
  return shell({
    title: '微信公众号 · 原创排行榜',
    style: STYLE_WEIXIN,
    body: `
<nav class="wx-nav"><div class="wx-nav-in">
  <span class="wx-logo">新榜</span>
  <h1>微信公众号排行榜</h1>
</div></nav>
<main class="wx-main">
  <p class="wx-crumb"><a href="/">首页</a> / <b>原创榜</b>　统计周期：2020-11-01 至 2020-11-07</p>
  <div class="wx-card">
    <div class="wx-tabs"><span class="on">原创榜</span><span>资讯榜</span><span>财富榜</span><span>百科榜</span></div>
    <table>
<thead><tr><th style="width:70px">排名</th><th>公众号名称</th><th>微信号</th><th>预估活跃粉丝</th><th>头条平均阅读</th><th>头条最高阅读</th><th>头条平均在看</th><th>原创平均阅读</th><th>原创篇数</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
  </div>
  <div class="wx-note">作业 A（微信公众号排行榜分析）：给定原创排行榜里任一公众号名称，判断是否同时满足——头条平均阅读 &gt; 90000、原创平均阅读 &gt; 80000、预估活跃粉丝 &lt; 300万；满足返回 YES，否则返回 NO。本页数据与同目录 <b>weixindata.json</b> 一致（JSON 供参考，爬虫请解析本 HTML）。</div>
</main>
`,
  })
}

/* ------------------------------------------------------------------ */
/* 主题 B：内地电影票房排行榜（某日，15 部）                             */
/* ------------------------------------------------------------------ */
/**
 * DOM 契约（与 B--影片票房任务.py 一致）：
 *  span.movie-name（影片名）| span.releaseInfo（上映信息）
 *  div.boxDesc-wrap.red-color（综合票房文本，纯数字，单位万元）
 *  div.countRate-wrap（排片占比，如 24.8%；&lt;0.1% 需转义）
 * 边界样本：金刚川=已上映20天 / 一日成交=上映首日(0) / 翱翔雄心=点映(-1) / 某种夜晚=&lt;0.1%(0.001)
 */
const BOXOFFICE = [
  ['金刚川', '已上映20天', '432.33', '24.8%'],
  ['一日成交', '上映首日', '156.42', '3.1%'],
  ['翱翔雄心', '点映', '89.66', '5.2%'],
  ['我和我的家乡', '已上映32天', '1210.55', '18.6%'],
  ['夺冠', '已上映45天', '856.20', '12.4%'],
  ['急先锋', '已上映38天', '276.88', '9.8%'],
  ['姜子牙', '已上映41天', '1602.36', '7.5%'],
  ['某种夜晚', '已上映30天', '12.05', '<0.1%'],
  ['掬水月在手', '已上映25天', '68.90', '1.2%'],
  ['一点就到家', '已上映35天', '302.11', '6.3%'],
  ['喜宝', '已上映42天', '145.79', '2.8%'],
  ['木兰：横空出世', '已上映28天', '78.45', '4.6%'],
  [' 七月之后', '已上映15天', '34.50', '1.9%'],
  ['半部喜剧', '已上映52天', '198.66', '2.2%'],
  ['生存家族', '已上映60天', '45.33', '0.9%'],
]

function genBoxOffice() {
  // 排片占比 → 进度条宽度（<0.1% 按 1% 显示宽度，文本契约不受影响）
  const barW = (rate) => {
    const v = parseFloat(rate.replace('%', '')) || 0.1
    return Math.max(v, 1).toFixed(1)
  }
  const rows = BOXOFFICE.map(
    (r, i) =>
      `  <tr class="my-row"><td><i class="my-rank${i < 3 ? ' r' + (i + 1) : ''}">${i + 1}</i></td>` +
      `<td><span class="movie-name">${esc(r[0])}</span><span class="releaseInfo">${esc(r[1])}</span></td>` +
      `<td><div class="boxDesc-wrap red-color">${esc(r[2])}</div><span class="my-unit">万</span></td>` +
      `<td><div class="countRate-wrap">${esc(r[3])}</div><span class="my-bar"><i style="width:${barW(r[3])}%"></i></span></td></tr>`
  ).join('\n')
  return shell({
    title: '内地电影票房排行榜 · 2020-11-06（虚构数据）',
    style: STYLE_MAOMEN,
    body: `
<header class="my-header"><div class="my-header-in">
  <p class="kicker">MAOMAN PRO</p>
  <h1>内地电影票房排行榜</h1>
  <p class="date">2020-11-06 · 综合票房单位：万元 · 数据来源：某票房统计平台</p>
</div></header>
<main class="my-main">
  <p class="my-crumb"><a href="/">首页</a> / 票房榜单 / <b>内地电影票房排行榜</b></p>
  <table>
<thead><tr class="my-cols"><th style="width:70px;text-align:center">排名</th><th>影片信息</th><th style="width:170px">综合票房</th><th style="width:190px">排片占比</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
  <div class="my-note">作业 B（影片票房任务）：给定影片名 movie_name，返回 [上映天数(int), 综合票房(float), 排片占比(float)]。上映首日 → 0；点映 → -1；'24.8%' → 0.248；&lt;0.1% → 0.001。示例：金刚川 → [20, 432.33, 0.248]。本页数据与同目录 <b>box_office_on_a_certain_day.json</b> 一致（JSON 供参考，爬虫请解析本 HTML）。</div>
</main>
`,
  })
}

/* ------------------------------------------------------------------ */
/* 主题 C：招聘网站（14 个职位详情页 + 4 个列表页）                        */
/* ------------------------------------------------------------------ */
/**
 * JOBS 字段：id, 职位名, 公司, 省/直辖市, 城市, 区县, 薪资, 经验, 学历
 *
 * DOM 契约（与 C--招聘网站职位信息分析.py 一致）：
 *  - h4.company：文本 = 公司名 +「招聘」两字（代码取 [:-2]）
 *  - h1.job-name[title]：职位名（代码 get('title')）
 *  - dd.job_request > h3 > span[]：
 *      spans[0] = span.salary（'8k-15k'，代码 split('-')[0] 取最低薪资）
 *      spans[1] = '省/城市'（代码 split('/')[1] 取城市，如 '湖北/武汉' → '武汉'）
 *      spans[2] = 经验要求
 *      spans[3] = 学历要求（'本科及以上'→'本科'；'学历不限'→命中 if edu=='学历' 分支）
 * 列表页契约（与 招聘网站公司职位统计.py 一致）：
 *  - div#s_position_list > ul > li，li[data-company]，li > em（城市文本）
 *  - 字节跳动的北京职位恰好 2 个（job_find('字节跳动') == 2）
 *  - 美味不用等仅有上海职位（job_find('美味不用等') == 0）
 */
const JOBS = [
  ['6836356', '高级数据分析师', '字节跳动', '湖北', '武汉', '洪山区', '8k-15k', '经验3-5年', '本科及以上'],
  ['5001277', 'Java开发工程师', '腾讯', '广东', '深圳', '南山区', '10k-18k', '经验1-3年', '硕士及以上'],
  ['6836357', '前端开发工程师', '字节跳动', '北京', '北京', '海淀区', '15k-25k', '经验3-5年', '本科及以上'],
  ['6836360', '数据产品经理', '字节跳动', '北京', '北京', '朝阳区', '18k-30k', '经验5-10年', '本科及以上'],
  ['6001123', '爬虫工程师', '美团', '北京', '北京', '朝阳区', '15k-25k', '经验1-3年', '本科及以上'],
  ['6002108', '算法工程师', '阿里巴巴', '浙江', '杭州', '西湖区', '20k-35k', '经验3-5年', '硕士及以上'],
  ['6010325', '测试工程师', '美味不用等', '上海', '上海', '静安区', '8k-12k', '经验1-3年', '学历不限'],
  ['6012216', '运营专员', '字节跳动', '湖北', '武汉', '东湖高新区', '4k-6k', '经验不限', '学历不限'],
  ['6023057', 'UI设计师', '快手', '北京', '北京', '海淀区', '10k-18k', '经验1-3年', '本科及以上'],
  ['6031129', '大数据开发工程师', '华为', '广东', '深圳', '龙岗区', '15k-28k', '经验3-5年', '硕士及以上'],
  ['6040216', 'Python开发工程师', '百度', '北京', '北京', '海淀区', '12k-20k', '经验1-3年', '本科及以上'],
  ['6051132', '新媒体运营', '三联生活周刊', '北京', '北京', '朝阳区', '6k-10k', '经验不限', '本科及以上'],
  ['6060231', '数据分析师', '京东', '北京', '北京', '大兴区', '10k-15k', '经验1-3年', '本科及以上'],
  ['6071054', '内容编辑', '拾遗', '广东', '广州', '天河区', '5k-8k', '经验1-3年', '本科及以上'],
]

const COMMON_CSS = `<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font: 14px/1.7 "Microsoft YaHei", "PingFang SC", sans-serif; color: #22262e; background: #f5f6f8; }
.wrap { max-width: 960px; margin: 0 auto; padding: 24px 16px 48px; }
a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }
</style>`

/** 职位详情页（jobs/{id}.html）· 拉勾风 */
function genJobPage(job) {
  const [id, title, company, province, city, district, salary, exp, edu] = job
  return shell({
    title: `${title} - ${company}招聘`,
    style: STYLE_LAGOU,
    body: `
<nav class="lg-nav"><div class="lg-nav-in">
  <span class="lg-logo">Lagou</span>
  <span class="lg-slogan">招聘网站（教学模拟）</span>
  <a href="../index.html" style="color:#fff;margin-left:auto;font-size:13px">← 返回职位列表</a>
  <a href="/" style="color:#fff;font-size:13px">实训站首页</a>
</div></nav>
<main class="lg-main">
  <div class="lg-detail-head">
    <h1 class="job-name" title="${esc(title)}">${esc(title)}<span class="salary">${esc(salary)}</span></h1>
    <dl class="job-detail">
      <dd class="job_request">
        <h3>
          <span class="salary">${esc(salary)}</span>
          <span>${esc(province + '/' + city)}</span>
          <span>${esc(exp)}</span>
          <span>${esc(edu)}</span>
        </h3>
      </dd>
    </dl>
  </div>
  <div class="lg-company-bar">
    <h4 class="company" style="font-size:18px;margin-bottom:4px">${esc(company)}招聘</h4>
    <p style="color:#666;font-size:13px">工作地点：${esc(province + city + district)}（教学模拟数据，具体地址略）</p>
  </div>
  <div class="lg-sec">
    <h2>职位描述</h2>
    <p>1. 负责相关业务的数据采集、清洗与分析工作；<br>2. 参与自动化工具链的建设与维护；<br>3. 输出分析报告，支撑业务决策。</p>
  </div>
  <p class="lg-note">教学模拟页面 · 职位编号 ${esc(id)} · 数据为虚构，仅用于《Data221》课程实训 · 作业 C：本页数据与同目录 <b>../jobs.json</b> 一致（JSON 供参考，爬虫请解析本 HTML）。</p>
</main>
`,
  })
}

/** 职位列表页（index.html / index_2/3/4.html）· 拉勾风 */
function genJobListPage(jobs, page, total) {
  const items = jobs
    .map((job) => {
      const [id, title, company, , city, district, salary] = job
      return `<li data-company="${esc(company)}">
  <a href="jobs/${esc(id)}.html">${esc(title)}</a>
  <em>${esc(city)}·${esc(district)}</em>
  <span class="salary">${esc(salary)}</span>
</li>`
    })
    .join('\n')
  const pager =
    page === 1
      ? `<a href="index_2.html">下一页</a>`
      : page === total
        ? `<a href="index${page - 1 > 1 ? '_' + (page - 1) : ''}.html">上一页</a>`
        : `<a href="index${page - 1 > 1 ? '_' + (page - 1) : ''}.html">上一页</a>　<a href="index_${page + 1}.html">下一页</a>`
  return shell({
    title: `热门职位 - 招聘网站（教学模拟）第${page}页`,
    style: STYLE_LAGOU,
    body: `
<nav class="lg-nav"><div class="lg-nav-in">
  <span class="lg-logo">Lagou</span>
  <span class="lg-slogan">招聘网站（教学模拟）</span>
  <span class="lg-search">搜索职位、公司或城市…</span>
</div></nav>
<main class="lg-main">
  <p class="lg-crumb"><a href="/">首页</a> / <b>热门职位</b>（第 ${page}/${total} 页）</p>
  <div id="s_position_list">
<ul>
${items}
</ul>
  </div>
  <p class="lg-pager">${pager}　<a href="/">← 返回实训站总领页</a></p>
  <p class="lg-note">教学模拟页面 · 数据为虚构，仅用于《Data221》课程实训 · 作业 C：职位数据另见同目录 <b>jobs.json</b>（JSON 供参考，爬虫请解析本 HTML）。</p>
</main>
`,
  })
}

/* ------------------------------------------------------------------ */
/* 主题 D：美食热门榜（20 家餐厅）                                       */
/* ------------------------------------------------------------------ */
/**
 * FOOD 字段：排名, 餐厅名, 菜系, 人均(整数), 评分, 口味, 环境, 服务, 评论数, 地址
 *
 * DOM 契约（与 D--美食榜单分析.py 一致）：
 *  - 餐厅名：span.shop-name（精确文本查找）
 *  - 人均：td 文本如 '95元'（解析为 int）
 *  - 评分：td 文本如 '4.8'（解析为 float）
 *  - 评论数：td 文本 '1.2万'（→12000）或 '8563'（→8563）
 * 边界样本：人均 <100 与 ≥100、评论数「万」与非「万」形态均须覆盖。
 */
const FOOD = [
  [1, '海底捞火锅(江汉路店)', '火锅', 95, 4.8, '1.2万', '湖北省武汉市江汉区江汉路步行街'],
  [2, '靓靓蒸虾(万松园店)', '湖北菜', 128, 4.7, '8563', '湖北省武汉市江汉区万松园路'],
  [3, '蔡林记热干面(户部巷店)', '小吃快餐', 15, 4.5, '2.3万', '湖北省武汉市武昌区户部巷'],
  [4, '老通城豆皮(吉庆街店)', '湖北菜', 25, 4.3, '6892', '湖北省武汉市江岸区吉庆街'],
  [5, '小民大排档(鹦鹉洲店)', '烧烤烤串', 78, 4.6, '9321', '湖北省武汉市汉阳区鹦鹉洲'],
  [6, '靓靓蒸虾(石牌岭店)', '湖北菜', 135, 4.6, '5218', '湖北省武汉市洪山区石牌岭路'],
  [7, '巴厘龙虾(雪松路店)', '湖北菜', 110, 4.7, '1.1万', '湖北省武汉市江汉区雪松路'],
  [8, '湖锦酒楼(八一路店)', '湖北菜', 180, 4.5, '4370', '湖北省武汉市武昌区八一路'],
  [9, '矮子馅饼(中山大道店)', '面包甜点', 20, 4.4, '3.4万', '湖北省武汉市硚口区中山大道'],
  [10, '苗栗路烤羊腿', '烧烤烤串', 95, 4.4, '7650', '湖北省武汉市江岸区苗栗路'],
  [11, '稻香海鲜火锅酒家', '粤菜', 210, 4.6, '3980', '湖北省武汉市江汉区建设大道'],
  [12, '青瓦炭韩烤肉(楚河汉街店)', '韩国料理', 120, 4.5, '6042', '湖北省武汉市武昌区楚河汉街'],
  [13, '一茶一坐(武汉天地店)', '台湾菜', 85, 4.2, '2876', '湖北省武汉市江岸区武汉天地'],
  [14, '汉口精武路鸭脖(总店)', '卤味熟食', 30, 4.3, '1.8万', '湖北省武汉市江汉区精武路'],
  [15, '四季美汤包(户部巷店)', '小吃快餐', 22, 4.4, '1.5万', '湖北省武汉市武昌区户部巷'],
  [16, '粗茶淡饭·私房菜(汉口店)', '私房菜', 260, 4.7, '2150', '湖北省武汉市江岸区黎黄陂路'],
  [17, '棉花唐烤肉(街道口店)', '烧烤烤串', 88, 4.3, '5433', '湖北省武汉市洪山区街道口'],
  [18, '老巷子油焖大虾(拦江路店)', '湖北菜', 105, 4.5, '4718', '湖北省武汉市汉阳区拦江路'],
  [19, '周黑鸭(江汉路旗舰店)', '卤味熟食', 35, 4.2, '2.1万', '湖北省武汉市江汉区江汉路'],
  [20, '和风蟹之屋日料(菱角湖店)', '日本料理', 245, 4.6, '1892', '湖北省武汉市江汉区菱角湖路'],
]

function genFood() {
  const stars = (score) => '★'.repeat(Math.round(score)) + '☆'.repeat(5 - Math.round(score))
  const rows = FOOD.map(
    (r) =>
      `  <tr><td><i class="dp-rank${r[0] <= 3 ? ' r' + r[0] : ''}">${r[0]}</i></td>` +
      `<td><span class="shop-name">${esc(r[1])}</span></td>` +
      `<td class="dp-cuisine">${esc(r[2])}</td>` +
      `<td class="dp-avg">${r[3]}元</td>` +
      `<td class="dp-score">${r[4]}</td>` +
      `<td class="dp-cmt">${esc(r[5])}</td>` +
      `<td class="dp-addr">${esc(r[6])}</td>` +
      `<td><span class="dp-star">${stars(r[4])}</span></td></tr>`
  ).join('\n')
  return shell({
    title: '美食热门榜 · 武汉（虚构数据）',
    style: STYLE_DIANPING,
    body: `
<header class="dp-header"><div class="dp-header-in">
  <p class="kicker">MEITUAN-DIANPING · 必吃榜</p>
  <h1>武汉美食热门榜</h1>
  <p class="date">统计周期：2026-10-18 至 2026-11-17 · 数据为虚构，仅用于教学</p>
</div></header>
<main class="dp-main">
  <p class="dp-crumb"><a href="/">首页</a> / 武汉 / <b>美食热门榜</b></p>
  <table>
<thead><tr><th style="width:70px">排名</th><th>餐厅名称</th><th style="width:90px">菜系</th><th style="width:90px">人均消费</th><th style="width:70px">评分</th><th style="width:90px">评论数</th><th>地址</th><th style="width:110px">口碑</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
  <div class="dp-note">作业 D（美食榜单分析）：给定餐厅名，返回 [人均消费(int), 评分(float), 评论数(int)]。
'95元' → 95；'4.8' → 4.8；'1.2万' → 12000、'8563' → 8563。示例：foodData('海底捞火锅(江汉路店)') → [95, 4.8, 12000]。本页数据与同目录 <b>restaurant_list.json</b> 一致（JSON 供参考，爬虫请解析本 HTML）。</div>
</main>
`,
  })
}

/* ------------------------------------------------------------------ */
/* JSON 参考数据（与各页面 HTML 内嵌数据一一对应）                         */
/* ------------------------------------------------------------------ */
function jsonWeixin() {
  return JSON.stringify(
    WEIXIN.map((r) => ({
      rank: r[0], name: r[1], wx_id: r[2], active_fans: r[3],
      top_avg_read: r[4], top_max_read: r[5], top_avg_look: r[6],
      orig_avg_read: r[7], orig_count: r[8],
    })),
    null, 2
  )
}
function jsonBoxOffice() {
  return JSON.stringify(
    BOXOFFICE.map((r, i) => ({
      rank: i + 1, name: r[0], release_info: r[1], box_office_wan: parseFloat(r[2]), show_rate: r[3],
    })),
    null, 2
  )
}
function jsonJobs() {
  return JSON.stringify(
    JOBS.map((r) => ({
      id: r[0], title: r[1], company: r[2], province: r[3], city: r[4],
      district: r[5], salary: r[6], exp: r[7], edu: r[8],
    })),
    null, 2
  )
}
function jsonFood() {
  return JSON.stringify(
    FOOD.map((r) => ({
      rank: r[0], name: r[1], cuisine: r[2], avg_price: r[3],
      score: r[4], comments: r[5], address: r[6],
    })),
    null, 2
  )
}

/* ------------------------------------------------------------------ */
/* 入口：生成全部页面                                                   */
/* ------------------------------------------------------------------ */
const fileList = []
function write(rel, content) {
  const abs = path.join(OUT, rel)
  mkdirSync(path.dirname(abs), { recursive: true })
  writeFileSync(abs, content, 'utf8')
  fileList.push(rel)
}

// 主题 A / B / D（HTML + 同目录 JSON 参考数据）
write('weixindata.html', genWeixin())
write('weixindata.json', jsonWeixin())
write('box_office_on_a_certain_day.html', genBoxOffice())
write('box_office_on_a_certain_day.json', jsonBoxOffice())
write('food/restaurant_list.html', genFood())
write('food/restaurant_list.json', jsonFood())

// 主题 C：14 个详情页 + 4 个列表页（每页 3~4 条，全部职位各出现一次）
const pageSize = 4
const totalPages = Math.ceil(JOBS.length / pageSize)
for (let p = 1; p <= totalPages; p++) {
  const slice = JOBS.slice((p - 1) * pageSize, p * pageSize)
  const name = p === 1 ? 'index.html' : `index_${p}.html`
  write(`zhaopin/${name}`, genJobListPage(slice, p, totalPages))
}
for (const job of JOBS) {
  write(`zhaopin/jobs/${job[0]}.html`, genJobPage(job))
}
write('zhaopin/jobs.json', jsonJobs())

console.log(`[gen-homework-pages] 已生成 ${fileList.length} 个文件 → public/JS001/open/show/`)
for (const f of fileList) console.log('  - ' + f)
