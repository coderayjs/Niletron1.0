import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: frontendRoot,
  envDir: frontendRoot,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'NILETRON Smart Home',
        short_name: 'NILETRON',
        description: 'Smart Home Automation - NILE University',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          { urlPattern: /^https?:\/\/localhost:\d+\/api\//, handler: 'NetworkFirst', options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 } },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    strictPort: true,
    proxy: { '/api': 'http://localhost:4009' },
  },
});
