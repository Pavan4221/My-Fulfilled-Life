import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// When running in dev server, seamlessly route index.html to /src/main.tsx
const devHtmlPlugin = (): Plugin => ({
  name: 'dev-html-transform',
  transformIndexHtml(html, ctx) {
    if (ctx.server) {
      return html
        .replace(
          /<script type="module" crossorigin src="\.\/assets\/[^"]+"><\/script>/,
          '<script type="module" src="/src/main.tsx"></script>'
        )
        .replace(/<link rel="stylesheet" crossorigin href="\.\/assets\/[^"]+">/, '');
    }
    return html;
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [devHtmlPlugin(), react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
}));
