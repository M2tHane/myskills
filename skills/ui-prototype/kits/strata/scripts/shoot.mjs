#!/usr/bin/env node
// 截图自查：按 review.json 把每个页面的正常状态和四种 ?state= 各截一张（宽 1440），并生成总览页 .shots/index.html。
// 用法（在 docs/prototype/ 里，预览已在后台运行）：node scripts/shoot.mjs http://localhost:5173
// review.json：[{ "name": "供应商列表", "route": "/suppliers", "as": "chenjing" }]，as 可省略；路由里的参数换成真实编号。
// 浏览器用本机的 Chrome / Chromium，可以用环境变量 CHROME_PATH 指定。没装浏览器或 playwright-core 时只打印提示，退出码为 0。
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const OUT = '.shots';
const STATES = [
  { key: 'normal', label: '正常', wait: 1500 },
  { key: 'loading', label: '加载中', wait: 900 },
  { key: 'empty', label: '空数据', wait: 1500 },
  // 5xx 会先重试一次（约 1 秒）才显示出错
  { key: 'error', label: '出错', wait: 3200 },
  { key: 'forbidden', label: '无权限', wait: 1500 },
];
const PARALLEL = 3;

const skip = (msg) => { console.log(`· 跳过截图：${msg}`); process.exit(0); };
const die = (msg) => { console.error(`✗ ${msg}`); process.exit(1); };

const base = process.argv[2];
if (!base || !/^https?:\/\//.test(base)) die('用法：node scripts/shoot.mjs http://localhost:5173（预览地址，先在后台运行 npm run dev）');
if (!existsSync('review.json')) die('缺少 review.json：在 docs/prototype/ 里写页面清单 [{ "name": "页面名", "route": "/路由", "as": "演示账号（可省略）" }]');
let pages;
try { pages = JSON.parse(readFileSync('review.json', 'utf8')); } catch (e) { die(`review.json 不是合法的 JSON：${e.message}`); }
if (!Array.isArray(pages) || !pages.length) die('review.json 要是非空数组');
for (const p of pages) if (!p?.name || typeof p.route !== 'string' || !p.route.startsWith('/')) die(`review.json 里这一项不对：${JSON.stringify(p)}（要有 name 和以 / 开头的 route）`);

// 预览地址：http://localhost:5173 → http://localhost:5173/#/路由?as=…&state=…；也可以直接给 …/app.html
const root = /\.html$/.test(base) ? base : base.replace(/\/?$/, '/');
const urlOf = (p, state) => {
  const qs = [p.as && `as=${encodeURIComponent(p.as)}`, state !== 'normal' && `state=${state}`].filter(Boolean).join('&');
  return `${root}#${p.route}${qs ? (p.route.includes('?') ? '&' : '?') + qs : ''}`;
};
try { await fetch(root, { signal: AbortSignal.timeout(3000) }); } catch { die(`打不开 ${root}：先在后台运行 npm run dev，用它打印的地址`); }

let chromium;
try { ({ chromium } = await import('playwright-core')); } catch { skip('没有安装 playwright-core（在 docs/prototype/ 里运行 npm ci）'); }

if (process.env.CHROME_PATH && !existsSync(process.env.CHROME_PATH)) skip(`CHROME_PATH 指向的 ${process.env.CHROME_PATH} 不存在`);
const candidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
];
let executablePath = candidates.find((p) => p && existsSync(p));
if (!executablePath) { try { const p = chromium.executablePath(); if (existsSync(p)) executablePath = p; } catch { /* 没有 Playwright 自带的浏览器 */ } }
if (!executablePath) skip('找不到 Chrome / Chromium。装上 Chrome，或用 CHROME_PATH=<浏览器路径> 指定');

const file = (p, s) => `${p.name.replace(/[\\/:*?"<>|\s]+/g, '-')}-${s}.png`;
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith('.png')) rmSync(path.join(OUT, f));

const browser = await chromium.launch({ executablePath, headless: true });
// 预热：开发服务器第一次打开要先编译，等它加载完再开始计时截图
{ const warm = await browser.newPage(); await warm.goto(urlOf(pages[0], 'normal'), { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}); await warm.close(); }
const problems = [];
const started = Date.now();
// 每个页面一个独立的浏览器上下文：演示身份存在 localStorage 里，各页互不影响
async function shootPage(p) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await Promise.all(STATES.map(async (s) => {
    const tab = await ctx.newPage();
    const errs = [];
    tab.on('pageerror', (e) => errs.push(e.message));
    tab.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    try {
      await tab.goto(urlOf(p, s.key), { waitUntil: 'load', timeout: 15000 });
      await tab.waitForTimeout(s.wait);
      await tab.screenshot({ path: path.join(OUT, file(p, s.key)) });
    } catch (e) { errs.push(`截图失败：${e.message}`); }
    if (errs.length) problems.push(`${p.name}（${s.label}）：${[...new Set(errs)].join('；')}`);
    await tab.close();
  }));
  await ctx.close();
  console.log(`✓ ${p.name}`);
}
const queue = [...pages];
await Promise.all(Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => { while (queue.length) await shootPage(queue.shift()); }));
await browser.close();

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const rows = pages.map((p) => `<tr><th>${esc(p.name)}<small>${esc(p.route)}${p.as ? ` · ${esc(p.as)}` : ''}</small></th>${STATES.map((s) =>
  `<td><a href="${esc(urlOf(p, s.key))}" target="_blank"><img src="${esc(file(p, s.key))}" alt="${esc(`${p.name} ${s.label}`)}" loading="lazy"></a><a class="full" href="${esc(file(p, s.key))}" target="_blank">原图</a></td>`).join('')}</tr>`).join('\n');
writeFileSync(path.join(OUT, 'index.html'), `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>原型截图总览</title>
<style>
body{margin:24px;font:14px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#1f2329;background:#f5f6f8}
table{border-collapse:collapse;background:#fff}th,td{border:1px solid #e3e5e8;padding:8px;vertical-align:top;text-align:left}
thead th{background:#f0f1f3;font-weight:600}tbody th{width:160px}small{display:block;color:#6b7280;font-weight:400;word-break:break-all}
img{display:block;width:288px;border:1px solid #e3e5e8}.full{font-size:12px;color:#6b7280}ul{color:#b42318}
</style></head><body>
<h1>原型截图总览</h1>
<p>${pages.length} 个页面 · 宽 1440 · 点缩略图打开预览地址（预览要在运行），点「原图」看截图。${new Date().toLocaleString('zh-CN')}</p>
${problems.length ? `<h2>页面报错</h2><ul>${problems.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
<table><thead><tr><th>页面</th>${STATES.map((s) => `<th>${s.label}</th>`).join('')}</tr></thead><tbody>
${rows}
</tbody></table></body></html>
`);

console.log(`\n✓ ${pages.length} 个页面 × ${STATES.length} 种状态，用时 ${((Date.now() - started) / 1000).toFixed(0)} 秒；总览：${OUT}/index.html`);
if (problems.length) { console.log('页面报错：'); for (const x of problems) console.log(`  ✗ ${x}`); }
