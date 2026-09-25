import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-192x192.svg", "pwa-512x512.svg"],
      manifest: {
        name: "ScamWatch — Fraud Investigation Workspace",
        short_name: "ScamWatch",
        description: "Community scam reporting and fraud investigation workspace",
        theme_color: "#3b5bdb",
        background_color: "#f9fafb",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192x192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/pwa-512x512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "scamwatch-api",
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /\/uploads\//,
            handler: "CacheFirst",
            options: {
              cacheName: "scamwatch-evidence",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ request }) => ["script", "style", "image", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "scamwatch-static",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});
