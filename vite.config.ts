import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendUrl = "http://localhost:3000";

const apiRoutes = [
  "auth",
  "products",
  "stockOpening",
  "cashbook",
  "chart-of-account",
  "audit-logs",
  "sale-return",
  "purchase-invoice",
  "delivery-chalan",
  "journal-vouchers",
  "sale-invoice",
  "purchase-return",
  "reports",
].join("|");

export default defineConfig({
  plugins: [react()],
  base: "/", // 👈 important for correct routing on deployment
  optimizeDeps: {
    include: ["jspdf", "jspdf-autotable", "html2canvas", "dompurify", "canvg"],
  },
  server: {
    proxy: {
      [`^/(${apiRoutes})(/|$)`]: {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
});
