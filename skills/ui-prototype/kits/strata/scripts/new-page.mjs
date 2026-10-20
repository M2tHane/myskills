#!/usr/bin/env node
// 生成页面空壳：页面、接口层、假数据，并把路由（和导航）插进 src/app/。四种状态、两种空状态已经接好，要按 PRD 填的地方标了 TODO(prd)。
// 用法（在 docs/prototype/ 里）：
//   node scripts/new-page.mjs <list|detail|form> <资源名> --route <路由> --title <页面标题> [--noun <名词>] [--nav]
//   node scripts/new-page.mjs list supplier --route /suppliers --title 供应商 --nav
//   node scripts/new-page.mjs detail supplier --route /suppliers/:id --title 供应商详情
//   node scripts/new-page.mjs form supplier --route /suppliers/new,/suppliers/:id/edit --title 新建/编辑供应商
// 资源名用小写英文和连字符（purchase-order）。--route 可以写多个，用「,」或「、」隔开。
// --noun 是空状态、按钮里的名词（「还没有供应商」「新建供应商」），默认从标题去掉「新建、编辑、列表、详情」得到。
// 只用 Node 自带模块。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const TPL = [path.join(here, 'templates'), path.join(here, '..', 'templates')].find((d) => existsSync(d));
const ROUTES = 'src/app/routes.tsx';
const NAV = 'src/app/nav.tsx';
const ROUTES_MARK = '// @new-page:routes';
const NAV_MARK = '// @new-page:nav';
const TYPES = ['list', 'detail', 'form'];

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// —— 参数 ——
const flags = {};
const positional = [];
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith('--')) positional.push(a);
  else if (['route', 'title', 'noun'].includes(a.slice(2))) flags[a.slice(2)] = process.argv[++i];
  else flags[a.slice(2)] = true;
}
const opt = (name) => (typeof flags[name] === 'string' ? flags[name] : undefined);
const [type, resource] = positional;
if (!TYPES.includes(type) || !resource) die('用法：node scripts/new-page.mjs <list|detail|form> <资源名> --route <路由> --title <页面标题> [--noun <名词>] [--nav]');
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(resource)) die(`资源名「${resource}」只能用小写英文、数字和连字符，如 purchase-order`);
const title = opt('title');
const routeArg = opt('route');
if (!title) die('缺少 --title（页面标题，如 供应商）');
if (!routeArg) die('缺少 --route（路由，如 /suppliers）');
if (!TPL) die(`找不到模板目录：${path.join(here, 'templates')}`);
if (!existsSync(ROUTES)) die(`找不到 ${ROUTES}：在 docs/prototype/ 里运行`);

const routes = routeArg.split(/[,、]/).map((r) => r.trim()).filter(Boolean);
for (const r of routes) if (!/^\/[\w\-/:]*$/.test(r) || r === '/') die(`路由「${r}」不对：以 / 开头，如 /suppliers、/suppliers/:id`);
// 资源的根路由：去掉末尾的 /new、/:id/edit、/:id
const baseOf = (r) => r.replace(/\/(new|:[\w]+\/edit|:[\w]+)$/, '');
const base = baseOf(routes[0]);
if (!base || base === '/') die(`从「${routes[0]}」得不到列表的路由`);
for (const r of routes) if (baseOf(r) !== base) die(`同一页的路由要在同一个根路由下：${routes.join('、')}`);
const param = (routes.map((r) => /:(\w+)/.exec(r)?.[1]).find(Boolean)) ?? 'id';
if (type === 'detail' && !routes.some((r) => /:\w+/.test(r))) die('详情页的路由要带参数，如 /suppliers/:id');

// —— 名字 ——
const parts = resource.split('-');
const Name = parts.map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const camel = Name[0].toLowerCase() + Name.slice(1);
const UPPER = parts.join('_').toUpperCase();
const PREFIX = (parts.length > 1 ? parts.map((p) => p[0]).join('') : resource.slice(0, 3)).toUpperCase();
const noun = opt('noun') ?? (title.replace(/^(新建\s*\/\s*编辑|新建|编辑|新增)\s*/, '').replace(/\s*(列表|详情|管理|页面|页)$/, '') || title);
let seed = 2166136261;
for (const ch of resource) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
const vars = { Name, kebab: resource, camel, UPPER, PREFIX, SEED: String(seed % 100000), title, noun, base, route: routes.join('、'), param };

function render(file) {
  return readFileSync(path.join(TPL, file), 'utf8').replace(/__([A-Za-z]+?)__/g, (m, k) => {
    if (!(k in vars)) die(`模板 ${file} 里有未知的占位符 ${m}`);
    return vars[k];
  });
}

const done = [];
const notes = [];

// —— 页面 ——
const Page = `${Name}${type[0].toUpperCase()}${type.slice(1)}Page`;
const pageFile = `src/pages/${resource}/${resource}-${type}-page.tsx`;
if (existsSync(pageFile)) die(`${pageFile} 已经存在，不覆盖`);
mkdirSync(path.dirname(pageFile), { recursive: true });
writeFileSync(pageFile, render(`${type}-page.tsx.tpl`));
done.push(`新建 ${pageFile}`);

// —— 假数据、接口层：已存在就跳过 ——
const mockFile = `src/mocks/${resource}.ts`;
if (existsSync(mockFile)) notes.push(`${mockFile} 已存在，跳过`);
else { writeFileSync(mockFile, render('mock.ts.tpl')); done.push(`新建 ${mockFile}（30 条）`); }

const apiFile = `src/api/${resource}.ts`;
const HOOKS = {
  list: [[`use${Name}List`, `(p: ${Name}ListParams) => useQuery(...)，返回 { items, total }`], [`${camel}Statuses`, '状态的取值列表']],
  detail: [[`use${Name}Detail`, '(id?: string) => useQuery(...)，找不到时返回 null']],
  form: [[`use${Name}Detail`, '(id?: string) => useQuery(...)'], [`useCreate${Name}`, `() => useMutation(${Name}Input)`],
    [`useUpdate${Name}`, `() => useMutation({ id, input })`], [`useDelete${Name}`, '() => useMutation(id)'], [`${camel}Statuses`, '状态的取值列表']],
};
if (!existsSync(apiFile)) { writeFileSync(apiFile, render('api.ts.tpl')); done.push(`新建 ${apiFile}`); }
else {
  const src = readFileSync(apiFile, 'utf8');
  const missing = HOOKS[type].filter(([n]) => !new RegExp(`export\\s+(const|function)\\s+${n}\\b`).test(src));
  notes.push(missing.length
    ? `${apiFile} 已存在，跳过；页面还要用到下面这些，手动补上：\n${missing.map(([n, sig]) => `    ${n}  ${sig}`).join('\n')}`
    : `${apiFile} 已存在，跳过（页面要用的都有）`);
}

// —— 路由：插在 // @new-page:routes 前面；同一个根路由的页面放在同一组里，面包屑分两级 ——
let rt = readFileSync(ROUTES, 'utf8');
const indentOf = (src, at) => /[ \t]*$/.exec(src.slice(0, at))[0];
const insertBefore = (src, at, text) => { const i = src.lastIndexOf('\n', at) + 1; return src.slice(0, i) + text + src.slice(i); };
// 总标记后面可以跟说明文字；分组标记是「// @new-page:routes /根路由」
const markAt = /\/\/ @new-page:routes(?![ \t]+\/)/.exec(rt)?.index ?? -1;
if (markAt < 0) die(`${ROUTES} 里找不到标记「${ROUTES_MARK}」：把它放回 AppLayout 的 children 里、path: '*' 那一行前面`);

const groupMark = `${ROUTES_MARK} ${base}\n`;
const child = (r) => {
  const rel = r.slice(base.length).replace(/^\//, '');
  if (!rel) return `{ index: true, element: <${Page} /> },`;
  const crumb = rel === 'new' ? `'新建'` : /\/edit$/.test(rel) ? `'编辑'` : /^:\w+$/.test(rel) ? `(m) => m.params.${param} ?? ''` : `'${title}'`;
  return `{ path: '${rel}', element: <${Page} />, handle: h({ crumb: ${crumb} }) },`;
};
const children = routes.map(child);
if (rt.includes(groupMark)) {
  for (const c of children) {
    const at = rt.indexOf(groupMark);
    const key = /path: '[^']*'|index: true/.exec(c)[0];
    const group = rt.slice(Math.max(0, rt.lastIndexOf(`path: '${base.slice(1)}'`, at)), at);
    if (group.includes(key)) { notes.push(`${ROUTES} 里 ${base} 下已经有 ${key}，跳过`); continue; }
    rt = insertBefore(rt, at, `${indentOf(rt, at)}${c}\n`);
  }
} else if (rt.includes(`path: '${base.slice(1)}'`)) {
  notes.push(`${ROUTES} 里已经手写了 path: '${base.slice(1)}'，没有插路由：把下面几行加进它的 children，或在 children 末尾加一行「${ROUTES_MARK} ${base}」再运行\n${children.map((c) => `    ${c}`).join('\n')}`);
} else {
  const pad = indentOf(rt, markAt);
  rt = insertBefore(rt, markAt, [
    `${pad}{`,
    `${pad}  path: '${base.slice(1)}', handle: h({ crumb: '${noun}' }),`,
    `${pad}  children: [`,
    ...children.map((c) => `${pad}    ${c}`),
    `${pad}    ${ROUTES_MARK} ${base}`,
    `${pad}  ],`,
    `${pad}},`,
    '',
  ].join('\n'));
}
const imp = `import { ${Page} } from '@/pages/${resource}/${resource}-${type}-page';`;
if (!rt.includes(imp)) {
  const lastImport = [...rt.matchAll(/^import .*;$/gm)].at(-1);
  const at = lastImport ? lastImport.index + lastImport[0].length + 1 : 0;
  rt = rt.slice(0, at) + imp + '\n' + rt.slice(at);
}
writeFileSync(ROUTES, rt);
if (!notes.some((n) => n.startsWith(`${ROUTES} 里已经手写`))) done.push(`路由 ${routes.join('、')} → ${ROUTES}`);

// —— 导航（--nav）：插在 // @new-page:nav 前面 ——
if (flags.nav) {
  const target = routes.find((r) => !r.includes(':') && !r.endsWith('/new'));
  if (!target) notes.push(`--nav 跳过：${routes.join('、')} 不是列表这类能直接打开的地址`);
  else if (!existsSync(NAV)) notes.push(`--nav 跳过：找不到 ${NAV}`);
  else {
    let nav = readFileSync(NAV, 'utf8');
    const at = nav.indexOf(NAV_MARK);
    if (at < 0) notes.push(`--nav 跳过：${NAV} 里找不到标记「${NAV_MARK}」`);
    else if (nav.includes(`key: '${target}'`)) notes.push(`--nav 跳过：导航里已经有 ${target}`);
    else {
      // TODO(prd) 图标：先统一用 FileText，按页面含义换成 lucide 里合适的
      nav = insertBefore(nav, at, `${indentOf(nav, at)}{ key: '${target}', label: '${noun}', icon: <FileText /> },\n`);
      nav = nav.replace(/import \{([^}]*)\} from 'lucide-react';/, (m, names) =>
        names.split(',').map((s) => s.trim()).includes('FileText') ? m : `import {${names.replace(/\s*$/, '')}, FileText } from 'lucide-react';`);
      if (!nav.includes("from 'lucide-react'")) nav = `import { FileText } from 'lucide-react';\n` + nav;
      writeFileSync(NAV, nav);
      done.push(`导航「${noun}」→ ${NAV}`);
    }
  }
}

for (const d of done) console.log(`✓ ${d}`);
for (const n of notes) console.log(`· ${n}`);
console.log(`\n下一步：照 PRD 页面规格填 ${pageFile} 里的 TODO(prd)；字段、状态、条数改 ${mockFile} 和 ${apiFile}。`);
