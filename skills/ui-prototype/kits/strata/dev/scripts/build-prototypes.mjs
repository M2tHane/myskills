// 把 demo 中的页面各自打成一个可离线打开的单文件 HTML，输出到套件的 prototypes/。
// 用法（在 dev/ 里）：npm run prototypes
import { build } from 'vite';
import { rmSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '..', 'prototypes');
const pages = [
  ['app', 'app.html'],        // 全部页面，hash 路由互相跳转
  ['gallery', 'gallery.html'], // 组件总览
];

mkdirSync(outDir, { recursive: true });
process.env.PROTOTYPE = '1';
for (const [page, file] of pages) {
  const tmp = path.join(outDir, '.tmp-' + page);
  process.env.VITE_PAGE = page;
  process.env.OUT_DIR = tmp;
  await build({ configFile: path.join(root, 'vite.config.ts'), logLevel: 'warn', mode: 'production' });
  const target = path.join(outDir, file);
  if (existsSync(target)) rmSync(target);
  renameSync(path.join(tmp, 'index.html'), target);
  rmSync(tmp, { recursive: true, force: true });
  console.log('✓ prototypes/' + file);
}
