// 截图自查（需要另装 playwright）：node scripts/shoot.mjs [query detail overview gallery]
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';
const OUT = process.env.SHOT_DIR ?? 'shots';
mkdirSync(OUT, { recursive: true });
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['', 'queries', 'data/tables/orders_daily', 'gallery'];
const server = await createServer({ configFile: 'vite.config.ts', server: { port: 5199 }, logLevel: 'error' });
await server.listen();
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('ERR', e.message));
p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
for (const pg of pages) {
  await p.goto(`http://localhost:5199/#/${pg}`); await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/${pg.replaceAll('/', '_') || 'overview'}.png`, fullPage: true });
  console.log('shot', pg);
}
await b.close(); await server.close();
