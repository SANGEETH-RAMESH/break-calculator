import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'logo.png',
        'logo1.png',
        'overbreak.png',
        'morning.png',
        'noon.png',
        'evening.png',
        'night.png',
        'mobile_morning.png',
        'mobile_noon.png',
        'mobile_evening.png',
        'mobile_night.png',
      ],
      manifest: {
        name: 'Break Calculator',
        short_name: 'Break Calc',
        description: 'Track and calculate your work shift breaks with precision',
        theme_color: '#0a1628',
        background_color: '#070f1e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
    }),
  ],
})

