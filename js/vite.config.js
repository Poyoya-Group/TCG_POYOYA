import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5500,
    host: true,
    allowedHosts: true,        // nécessaire derrière Codespaces / un tunnel
    hmr: { clientPort: 443 }   // rechargement à chaud derrière HTTPS
  },
  build: {
    outDir: "dist"
  }
});
