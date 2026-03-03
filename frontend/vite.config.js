import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    build: {
        outDir: '../backend/public',
        emptyOutDir: true,
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'logo.png'],
            manifest: {
                name: "Establecimiento ko'ẽju",
                short_name: "ko'ẽju",
                description: 'Gestión Ganadera Inteligente - Establecimiento ko\'ẽju',
                theme_color: '#0f172a',
                background_color: '#ffffff',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                icons: [
                    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
                ]
            },
            workbox: {
                // Network-first for all assets: always fetch fresh, fall back to cache
                runtimeCaching: [
                    {
                        urlPattern: /^https?.*/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'all-cache-v2',
                            expiration: { maxEntries: 50, maxAgeSeconds: 60 },
                            networkTimeoutSeconds: 4,
                        },
                    },
                ],
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
            }
        })
    ],
})
