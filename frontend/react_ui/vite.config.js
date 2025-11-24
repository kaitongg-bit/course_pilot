import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      }
    }
  },
  publicDir: "public" // <-- THIS COPIES public/* into build/
});
