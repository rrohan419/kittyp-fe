import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import basicSsl from "@vitejs/plugin-basic-ssl";
import fs from "node:fs";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const mkcertCert = path.resolve(__dirname, ".cert/localhost.pem");
const mkcertKey = path.resolve(__dirname, ".cert/localhost-key.pem");
const hasMkcert = fs.existsSync(mkcertCert) && fs.existsSync(mkcertKey);

export default defineConfig(({ mode }) => ({
  server: {
    // ipv4first + host "localhost" binds 127.0.0.1 only; browsers hit ::1 first.
    host: "::",
    port: 8080,
    strictPort: true,
    ...(hasMkcert
      ? { https: { cert: fs.readFileSync(mkcertCert), key: fs.readFileSync(mkcertKey) } }
      : {}),
    hmr: {
      host: "localhost",
      port: 8080,
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/messaging'],
        },
      },
    },
  },
  plugins: [
    !hasMkcert && basicSsl(),
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "sitemap.xml"],
      injectRegister: "auto",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      manifestFilename: "manifest.json",
      injectManifest: {
        swSrc: "src/sw.ts",
        globDirectory: "dist",
        globPatterns: ["**/*.{ts,js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        // Keep SW off in local/dev so auth/session experiments aren't stuck
        // on a precached bundle that still used shared localStorage.
        enabled: false,
        type: "module",
        navigateFallback: 'index.html'
      },
      
      manifest: {
        name: "Kittyp — Veterinary Clinic CRM",
        short_name: "Kittyp",
        description:
          "Kittyp is the veterinary operating system for Indian clinics: appointments, consults, invoices, and a pet health record that stays with the pet.",
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
            purpose: "any",
          },
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
        categories: ["business", "medical", "productivity"],
        lang: "en",
        dir: "ltr",
        prefer_related_applications: false,
        related_applications: [],
        edge_side_panel: {
          preferred_width: 400,
        },
      },
    }),
    
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
