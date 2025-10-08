import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/", // 👈 important for correct routing on deployment
  optimizeDeps: {
    include: ["jspdf", "jspdf-autotable", "html2canvas", "dompurify", "canvg"],
  },
});
