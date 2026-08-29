import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Set BASE_PATH when deploying under a subpath, e.g. BASE_PATH=/training-log/ npm run build
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // The app asks before reloading so a swap mid-session can't interrupt a set.
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["icons/icon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Training log",
        short_name: "Training",
        description:
          "Offline training log for a 10-week strength and athletic block.",
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "portrait",
        background_color: "#14161a",
        theme_color: "#14161a",
        categories: ["health", "fitness", "productivity"],
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Everything the app needs is precached, so it opens with no network at all.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // Lets you exercise install/offline behaviour with `npm run dev`.
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      },
    }),
  ],
});
