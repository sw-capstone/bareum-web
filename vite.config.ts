import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 개발 프록시가 localhost Origin을 서버로 전달하면 서버의 CORS 정책에 막힙니다.
      '/api/v1': {
        target: 'https://api.bareum.site',
        changeOrigin: true,
        secure: true,
        bypass(request) {
          delete request.headers.origin;
        },
      },
      '/api': {
        target: 'https://api.bareum.site',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
        bypass(request) {
          delete request.headers.origin;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
