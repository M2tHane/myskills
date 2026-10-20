import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 预览用 `npm run dev`；`npm run build:html` 打成单文件 app.html（脚本、样式、字体都内联，双击就能打开）。
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), ...(command === 'build' ? [viteSingleFile()] : [])],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
}));
