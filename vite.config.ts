import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { VitePWA } from "vite-plugin-pwa";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [PrimeVueResolver()],
    }),
    VitePWA({
      registerType: "autoUpdate", // Atualiza o Service Worker automaticamente
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "Êxodo Airsoft",
        short_name: "ExodoAirsoft",
        description: "Sistema de gestão do Êxodo Airsoft",
        theme_color: "#081534", // Sugestão: use a cor principal do seu brasão
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/cloud\.appwrite\.io\/v1\/storage\/buckets\/.*\/files\/.*\/view/,
            handler: "CacheFirst", // Tenta o cache primeiro, se não tiver, vai na rede
            options: {
              cacheName: "appwrite-images-cache",
              expiration: {
                maxEntries: 50, // Limite de 50 fotos de operadores/equipamentos
                maxAgeSeconds: 60 * 60 * 24 * 30, // Cache por 30 dias
              },
              cacheableResponse: {
                statuses: [0, 200], // Garante que apenas respostas válidas sejam salvas
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
