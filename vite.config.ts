import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    
  },
  plugins: [
    
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt", "sitemap.xml"],
      strategies: "injectManifest",
      filename: "sw.js",
      manifestFilename: "manifest.json",
      injectManifest: {
        swSrc: "./src/sw.ts",
        globDirectory: "dist",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        swDest: "sw.js",
      },
      workbox: {
        sourcemap: true
      },
      
      manifest: {
        name: "Kittyp - Eco-Friendly Pet Products",
        short_name: "Kittyp",
        description:
          "Pure by Nature, Trusted by You",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#995af2",
        orientation: "portrait",
        scope: "/",
        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
        categories: ["shopping", "lifestyle", "pets"],
        lang: "en",
        dir: "ltr",
        prefer_related_applications: false,
        related_applications: [],
        edge_side_panel: {
          preferred_width: 400,
        },
      },
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: 'index.html'
      },
    }),
    
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
