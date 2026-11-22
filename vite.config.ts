import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@features': path.resolve(__dirname, './src/features'),
      '@config': path.resolve(__dirname, './src/config'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },

  // ---- Development Server ----
  server: {
    port: 5177,
    open: true,
    proxy: {
      '/api': {
        target: "https://dist.tamamapp.net",
        changeOrigin: true,
        secure: false,

        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Vite Proxy Error]', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[Vite Proxy] ${req.method} ${req.url} → ${proxyReq.path}`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[Vite Proxy] ${proxyRes.statusCode} ← ${req.url}`);
          });
        },
      },
    },
  },

  // ---- Production Build ----
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // ---- node_modules chunks ----
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router')
            ) {
              return 'vendor-react';
            }
            if (
              id.includes('@tanstack/react-query') ||
              id.includes('i18next') ||
              id.includes('react-i18next')
            ) {
              return 'vendor-state';
            }
            if (
              id.includes('react-hook-form') ||
              id.includes('zod') ||
              id.includes('@hookform')
            ) {
              return 'vendor-forms';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            return 'vendor';
          }

          // ---- Application feature chunks ----
          if (id.includes('src/i18n') || id.includes('src/locales')) {
            return 'app-i18n';
          }
          if (id.includes('src/shared/components')) {
            return 'shared-ui';
          }
          if (id.includes('src/shared/utils') || id.includes('src/shared/hooks') || id.includes('src/shared/api')) {
            return 'shared-utils';
          }
          if (id.includes('src/features/auth')) return 'feature-auth';
          if (id.includes('src/features/admin')) return 'feature-admin';
          if (id.includes('src/features/dashboard')) return 'feature-dashboard';
          if (id.includes('src/features/orders')) return 'feature-orders';
          if (id.includes('src/features/stores')) return 'feature-stores';
          if (id.includes('src/features/drivers')) return 'feature-drivers';
          if (id.includes('src/features/customers')) return 'feature-customers';
          if (id.includes('src/features/chat')) return 'feature-chat';
          if (id.includes('src/features/finance')) return 'feature-finance';
          if (id.includes('src/features/settings')) return 'feature-settings';
        },
      },
    },
    minify: 'esbuild',
  },

  // ---- CSS ----
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },

  // ---- Environment Variables ----
  envPrefix: 'VITE_',

  // ---- Dependency Pre-bundling ----
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'recharts',
      'react-hook-form',
      'zod',
      '@hookform/resolvers',
      'i18next',
      'react-i18next',
      'i18next-browser-languagedetector',
    ],
  },
});