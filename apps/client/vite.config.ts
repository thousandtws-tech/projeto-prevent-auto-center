import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  cacheDir: ".vite",
  plugins: [react()],
  optimizeDeps: {
    force: true,
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
