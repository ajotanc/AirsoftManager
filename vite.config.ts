import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import AutoImport from "unplugin-auto-import/vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      vue(),
      AutoImport({
        imports: [
          "vue",
          "vue-router",
          "pinia",
          {
            dayjs: [["default", "dayjs"]],
          },
        ],
        dts: "src/auto-imports.d.ts",
      }),
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
      Components({
        resolvers: [PrimeVueResolver()],
      }),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
        manifest: {
          name: `${env.VITE_TEAM_NAME} - ${env.VITE_TITLE}`,
          short_name: env.VITE_TEAM_NAME,
          start_url: "/login",
          display: "standalone",
          description: `${env.VITE_TEAM_NAME} - ${env.VITE_DESCRIPTON}`,
          theme_color: "#081534",
          background_color: "#FFFFFF",
          lang: "pt-BR",
          orientation: "any",
          icons: [
            {
              src: "images/pwa/pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "images/pwa/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "images/pwa/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "images/pwa/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          navigateFallbackDenylist: [/^\/sitemap\.xml$/, /^\/robots\.xml$/, /^\/llms\.xml$/, ],
          skipWaiting: true,
          clientsClaim: true,
          maximumFileSizeToCacheInBytes: 4000000,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
          globIgnores: ["**/remixicon-*.svg"],
          runtimeCaching: [
            {
              urlPattern:
                /^https:\/\/cloud\.appwrite\.io\/v1\/storage\/buckets\/.*\/files\/.*\/view/,
              handler: "CacheFirst",
              options: {
                cacheName: "appwrite-images-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/cloud\.appwrite\.io\/v1\/databases\/.*/,
              handler: "NetworkOnly",
            },
          ],
        },
      }),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
            dest: 'js',
          },
        ],
      }),
    ],
    define: {
      "process.env": {},
      global: "globalThis",
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("exceljs") || id.includes("xlsx")) {
              return "excel-vendor";
            }
            if (id.includes("pdfjs-dist")) {
              return "pdf-vendor";
            }
            if (id.includes("chart.js") || id.includes("vue-chartjs")) {
              return "chart-vendor";
            }
            if (id.includes("quill")) {
              return "editor-vendor";
            }
            if (id.includes("primevue")) {
              return "primevue-vendor";
            }
            if (id.includes("appwrite")) {
              return "appwrite-vendor";
            }
            if (id.includes("node_modules")) {
              return "vendor";
            }
          },
        },
      },
    },
    optimizeDeps: {
      include: ['pdfjs-dist']
    },
  };
});
