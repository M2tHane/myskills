#!/usr/bin/env node
// Strata 规范检查：颜色、阴影、圆角、字号只能来自 theme.css 的 token。
// 用法：node scripts/check.mjs <src 目录> [更多目录或文件...]，例如在原型目录里 node scripts/check.mjs src。
// 只用 Node 自带模块，不需要安装任何依赖。不传参数时检查本脚本上一级的 src/（在 Strata 套件里还检查 starter/src、dev/demo）。
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const kit = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 默认检查 Strata 自己的组件与样板；检查项目时传入项目的 src 目录。
const targets = process.argv.slice(2).length ? process.argv.slice(2) : [path.join(kit, 'src'), path.join(kit, 'starter/src'), path.join(kit, 'dev/demo')];
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'prototypes', '.git', 'fonts']);
const files = [];
const walk = (p) => {
  if (!existsSync(p)) return;
  const st = statSync(p);
  if (st.isDirectory()) {
    if (IGNORE_DIRS.has(path.basename(p))) return;
    for (const f of readdirSync(p)) walk(path.join(p, f));
  } else if (/\.(tsx?|jsx?|css)$/.test(p) && !/\.d\.ts$/.test(p)) files.push(p);
};
targets.forEach(walk);

// 前后边界：类名之间以空白、引号、反引号、花括号分隔；变体前缀以冒号结尾。
const B = String.raw`(?:^|(?<=[\s"'\`{:]))`;
const E = String.raw`(?=$|[\s"'\`}])`;
const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const COLOR_UTIL = 'bg|text|border(?:-[trblxyse])?|ring|ring-offset|outline|fill|stroke|from|via|to|divide|decoration|placeholder|accent|caret|shadow';
const SIDE = '(?:-(?:t|r|b|l|s|e|tl|tr|bl|br|ss|se|es|ee))?';

const RULES = [
  { id: 'hex-color', msg: '写死的颜色值，改用语义 token（bg-surface、text-fg-muted、border-border…）',
    re: /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/g, where: 'all' },
  { id: 'tw-palette', msg: 'Tailwind 默认色板已移除，改用语义 token',
    re: new RegExp(`${B}(?:[\\w-]+:)*(?:${COLOR_UTIL})-(?:${PALETTE}|black)-?(?:\\d{2,3})?(?:\\/\\d+)?${E}`, 'g'), where: 'all' },
  { id: 'tw-text-size', msg: 'Tailwind 默认字号已移除，改用 text-caption / text-body-sm / text-body / text-title-*',
    re: new RegExp(`${B}(?:[\\w-]+:)*text-(?:xs|sm|base|lg|[2-9]?xl)${E}`, 'g'), where: 'all' },
  { id: 'tw-shadow', msg: 'Tailwind 默认阴影已移除，改用 shadow-card / shadow-raised / shadow-overlay / shadow-control',
    re: new RegExp(`${B}(?:[\\w-]+:)*shadow(?:-(?:sm|md|lg|xl|2xl|inner))?${E}`, 'g'), where: 'all' },
  { id: 'tw-radius', msg: '圆角只有 rounded-xs / sm / md / lg / full 五档',
    re: new RegExp(`${B}(?:[\\w-]+:)*rounded${SIDE}(?:-(?:xl|2xl|3xl|4xl))?${E}`, 'g'), where: 'all' },
  { id: 'arbitrary-text', msg: '任意字号，改用字号 token（需要新档位先加进 theme.css）',
    re: new RegExp(`${B}(?:[\\w-]+:)*text-\\[\\d[^\\]]*\\]`, 'g'), where: 'all' },
  { id: 'arbitrary-style', msg: '页面代码里不写任意阴影、圆角、颜色值；需要时在组件里用 token 组合，或先补 token',
    re: new RegExp(`${B}(?:[\\w-]+:)*(?:shadow|rounded${SIDE}|bg|border(?:-[trblxyse])?|ring|outline|fill|stroke|from|via|to)-\\[[^\\]]+\\]`, 'g'), where: 'app' },
  { id: 'primitive-token', msg: '原始色阶（--gray-*、--blue-*）只允许在 components/ui 内部使用，页面里用语义 token',
    re: /--(?:gray|blue)-\d{1,3}\b/g, where: 'app' },
];

// 只检查字符串字面量（类名、样式值都在这里），注释与标识符不算。
const STRINGS = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`])\/\/.*$/gm, (m, p) => p + ' '.repeat(m.length - p.length));

// 数据层规则：只有 src/api/ 和 src/mocks/ 能引用模拟数据。
const MOCK_IMPORT = /\bfrom\s+['"](?:@\/mocks|(?:\.\.?\/)+(?:[\w-]+\/)*mocks)(?:\/[^'"]*)?['"]/g;
const isDataLayer = (f) => /(^|[\\/])src[\\/](api|mocks)[\\/]/.test(f);
const isAppSource = (f) => /(^|[\\/])src[\\/]/.test(f);

let count = 0;
for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  const base = path.basename(file);
  if (base === 'theme.css') continue; // token 的唯一来源
  const isCss = file.endsWith('.css');
  const inComponents = /(^|[\\/])components[\\/]ui[\\/]/.test(file);
  const raw = readFileSync(file, 'utf8');
  const src = stripComments(raw);
  if (!isCss && isAppSource(file) && !isDataLayer(file)) {
    for (const m of src.matchAll(MOCK_IMPORT)) {
      const line = src.slice(0, m.index).split('\n').length;
      console.log(`${rel}:${line}  [mock-import] ${m[0]}  — 页面不能直接引用模拟数据，改为从 src/api/ 的 hooks 取数`);
      count++;
    }
  }
  const chunks = isCss ? [{ text: src, index: 0 }] : [...src.matchAll(STRINGS)].map((m) => ({ text: m[0], index: m.index }));
  // 类名规则只用于写界面的文件：.tsx/.jsx，或用到 cn()/cva/clsx 的 .ts。其余 .ts（如图表配置）只查颜色。
  const classy = /\.(tsx|jsx)$/.test(file) || /class-variance-authority|\bcn\(|\bclsx\(|twMerge/.test(raw);
  for (const rule of RULES) {
    if (rule.where === 'app' && inComponents) continue;
    if (!classy && !['hex-color', 'primitive-token'].includes(rule.id)) continue;
    if (isCss && rule.id !== 'hex-color') continue;
    for (const { text, index } of chunks) {
      for (const m of text.matchAll(rule.re)) {
        const at = index + m.index;
        const line = src.slice(0, at).split('\n').length;
        console.log(`${rel}:${line}  [${rule.id}] ${m[0].trim()}  — ${rule.msg}`);
        count++;
      }
    }
  }
}

if (count) {
  console.log(`\n✗ ${count} 处不符合 Strata 规范（共检查 ${files.length} 个文件）`);
  process.exit(1);
}
console.log(`✓ Strata 规范检查通过（${files.length} 个文件）`);
