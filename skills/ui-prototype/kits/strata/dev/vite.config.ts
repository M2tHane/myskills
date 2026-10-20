import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

// 维护用：`vite` 打开组件总览与页面样板；`PROTOTYPE=1 vite build` 打成单文件 HTML。
const kit = path.resolve(__dirname, '..');
export default defineConfig({
  root: 'demo',
  plugins: [react(), tailwindcss(), ...(process.env.PROTOTYPE ? [viteSingleFile()] : [])],
  resolve: { alias: { '@': path.join(kit, 'src') } },
  server: { fs: { allow: [kit] } },
  build: { outDir: process.env.OUT_DIR ?? path.join(__dirname, 'dist'), emptyOutDir: true },
});
