#!/usr/bin/env node
// 交付前检查：docs/PRD.md、docs/ARCHITECTURE.md 与 docs/prototype/ 能不能直接作为 pi-forge 的输入。
// 规则照 pi-forge 的 src/core/spec/prd.ts（PRD 解析）、preflight.ts（开始前检查）、intake.ts（读取原型目录），以 pi-forge 为准。
// 用法（在项目根目录）：node <ui-prototype>/scripts/check-export.mjs [项目根目录]
// 只用 Node 自带模块。
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const PRD = 'docs/PRD.md';
const ARCH = 'docs/ARCHITECTURE.md';
const PROTO = 'docs/prototype';
const MAX_FILES = 500;
const MAX_BYTES = 30 * 1024 * 1024;

const errors = [];
const notes = [];
const abs = (rel) => path.join(root, rel);
const isFile = (rel) => existsSync(abs(rel)) && lstatSync(abs(rel)).isFile();

// —— PRD：需求编号、验收标准、页面表 ——
const REQ_IDS = /REQ-\d{3,}/g;
const AC_LINE = /^(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?(\*\*|__)?(AC\d+)(?![\w])\s*[:：.、]?\s*\1\s*[:：.、]?\s*(.*)$/i;
const PAGE_HEADER = /^(?:页面|页面名|页面名称|页面\s*id|page|page\s*id)$/i;

function cells(text) {
  if (!text.startsWith('|') && !text.includes(' | ')) return null;
  const parts = text.split(/(?<!\\)\|/);
  if (!parts[0]?.trim()) parts.shift();
  if (!parts.at(-1)?.trim()) parts.pop();
  return parts.map((p) => p.trim().replace(/\\\|/g, '|'));
}

function prototypePath(cell) {
  const link = /\]\(\s*(<[^>]*>|[^)\s]+)/.exec(cell);
  let raw = (link ? link[1] : cell).replace(/`/g, '').trim().replace(/^<(.*)>$/, '$1').replace(/#.*$/, '').trim();
  try { raw = decodeURIComponent(raw); } catch { /* 按原样用 */ }
  raw = raw.replace(/^(?:\.\/|\/)+/, '');
  if (!raw) return '';
  if (raw.startsWith('prototype/')) return `docs/${raw}`;
  return raw.includes('/') ? raw : `${PROTO}/${raw}`;
}

function parsePrd(md) {
  const reqs = [];
  const pages = [];
  let current = null;
  let table = null;
  let fence = null;
  md.replace(/\r\n?/g, '\n').split('\n').forEach((rawLine, i) => {
    const text = rawLine.trim();
    // 围栏规则同 pi-forge：结束围栏与开头同一种字符、长度不少于开头、后面没有别的内容
    if (fence) { const m = /^(`{3,}|~{3,})$/.exec(text); if (m && m[1][0] === fence.char && m[1].length >= fence.len) fence = null; return; }
    const f = /^(`{3,}|~{3,})(.*)$/.exec(text);
    if (f && !(f[1][0] === '`' && f[2].includes('`'))) { fence = { char: f[1][0], len: f[1].length }; return; }
    const row = cells(text);
    if (!row || (table?.piped && !text.startsWith('|'))) table = null;
    const heading = /^(#{1,6})\s+(.*)$/.exec(text);
    if (heading) {
      const ids = heading[2].match(REQ_IDS) ?? [];
      if (ids.length === 1) { current = { id: ids[0], line: i + 1, acs: [], level: heading[1].length }; reqs.push(current); }
      else if (current && heading[1].length <= current.level) current = null;
      return;
    }
    if (row) {
      if (table) {
        if (row.every((c) => /^:?-+:?$/.test(c))) return;
        const name = row[table.page] ?? '';
        const file = prototypePath(row[table.file] ?? '');
        if (name || file) pages.push({ name, file, reqs: (table.reqs >= 0 ? row[table.reqs] ?? '' : row.join(' ')).match(REQ_IDS) ?? [], line: i + 1 });
        return;
      }
      const page = row.findIndex((c) => PAGE_HEADER.test(c));
      const file = row.findIndex((c) => /原型|prototype/i.test(c));
      if (page >= 0 && file >= 0) { table = { page, file, reqs: row.findIndex((c) => c.includes('需求')), piped: text.startsWith('|') }; return; }
    }
    const ac = AC_LINE.exec(text);
    if (ac && current) current.acs.push(ac[2].toUpperCase());
    else if (ac) errors.push(`${PRD} 第 ${i + 1} 行的验收标准不在任何需求下面`);
  });
  return { reqs, pages };
}

if (!isFile(PRD)) errors.push(`缺少 ${PRD}：先运行 /grill-spec`);
else {
  const { reqs, pages } = parsePrd(readFileSync(abs(PRD), 'utf8'));
  const ids = new Set();
  for (const r of reqs) {
    if (ids.has(r.id)) errors.push(`${r.id} 出现了多次（第 ${r.line} 行）`);
    ids.add(r.id);
    if (!r.acs.length) errors.push(`${r.id}（第 ${r.line} 行）没有验收标准：每条一行，以「- AC1」开头`);
  }
  if (!reqs.length) errors.push(`${PRD} 里没有解析出需求：需求标题要带编号，例如「### 3.1 登录  REQ-001」`);
  if (!pages.length) errors.push(`${PRD} 里没有页面表：表头要有「页面」与「原型文件」两列`);
  for (const p of pages) {
    if (!p.file) errors.push(`页面表第 ${p.line} 行「${p.name}」没有写原型文件`);
    else if (!isFile(p.file)) errors.push(`页面「${p.name}」的原型文件 ${p.file} 不存在`);
    for (const r of p.reqs) if (!ids.has(r)) errors.push(`页面「${p.name}」引用的 ${r} 在需求里找不到`);
  }
  notes.push(`PRD：${reqs.length} 条需求、${reqs.reduce((n, r) => n + r.acs.length, 0)} 条验收标准、${pages.length} 个页面`);
}

// —— ARCHITECTURE：前端一节已由原型 skill 填好 ——
if (!isFile(ARCH)) errors.push(`缺少 ${ARCH}：先运行 /grill-spec`);
else {
  const md = readFileSync(abs(ARCH), 'utf8');
  const m = /^##\s*(?:[\d.、]+\s*)?前端\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m.exec(md);
  if (!m) errors.push(`${ARCH} 里没有「前端」一节`);
  else if (/ui-prototype/.test(m[1]) || !m[1].trim()) errors.push(`${ARCH} 的「前端」一节还没填：换成套件 KIT.md 里的「技术栈与版本」`);
  // 其他节里留给原型 skill 的占位（如「前端的测试与检查由 ui-prototype 填写」）
  md.split('\n').forEach((line, i) => {
    if (/由\s*ui-prototype\s*(负责|填写|填)/.test(line) && !(m && m[1].includes(line))) errors.push(`${ARCH} 第 ${i + 1} 行还留着给 ui-prototype 的占位：删掉这一行，前端的检查已经写在「前端」一节`);
  });
}

// —— 原型目录：pi-forge 开始前检查的文件，以及读取时的限制 ——
if (!existsSync(abs(PROTO))) errors.push(`缺少 ${PROTO}/`);
else {
  for (const f of ['DESIGN.md', 'theme.css']) if (!isFile(`${PROTO}/${f}`)) errors.push(`缺少 ${PROTO}/${f}`);
  let files = 0;
  let bytes = 0;
  const htmls = [];
  const walk = (rel) => {
    const st = lstatSync(abs(rel));
    const name = path.basename(rel);
    if (st.isSymbolicLink()) { errors.push(`不能有软链接：${rel}`); return; }
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.build') { errors.push(`交付前要删掉 ${rel}/`); return; }
      if (name === 'secrets') errors.push(`不能有敏感目录：${rel}/`);
      for (const n of readdirSync(abs(rel))) if (n !== '.DS_Store' && n !== '.git') walk(`${rel}/${n}`);
      return;
    }
    if (/^\.env/.test(name) || name.endsWith('.pem')) errors.push(`不能有敏感文件：${rel}`);
    files++;
    bytes += st.size;
    if (rel.endsWith('.html') && path.dirname(rel) === PROTO) htmls.push(rel);
  };
  walk(PROTO);
  if (!htmls.length) errors.push(`${PROTO}/ 里没有 .html`);
  if (files > MAX_FILES) errors.push(`${PROTO}/ 有 ${files} 个文件，超过 pi-forge 的上限 ${MAX_FILES}`);
  if (bytes > MAX_BYTES) errors.push(`${PROTO}/ 共 ${(bytes / 1048576).toFixed(1)} MB，超过 pi-forge 的上限 30 MB`);
  for (const h of htmls) {
    const target = /location\.replace\(\s*['"]([^'"#]+)#/.exec(readFileSync(abs(h), 'utf8'))?.[1];
    if (target && !isFile(`${PROTO}/${target}`)) errors.push(`${h} 跳转到的 ${target} 不存在：先打包`);
  }
  notes.push(`原型目录：${files} 个文件、${(bytes / 1048576).toFixed(1)} MB、${htmls.length} 个 .html`);
}

for (const n of notes) console.log(`  ${n}`);
if (errors.length) {
  for (const e of errors) console.log(`✗ ${e}`);
  console.log(`\n✗ ${errors.length} 处不符合 pi-forge 的输入要求`);
  process.exit(1);
}
console.log('✓ 可以作为 pi-forge 的输入（/forge-build）');
