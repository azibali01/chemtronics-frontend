import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const backendUrl = env.VITE_BACKEND_URL;
  const frontendPort = Number(env.VITE_PORT);

  if (!backendUrl) {
    throw new Error("VITE_BACKEND_URL is required in frontend .env");
  }
  if (!env.VITE_PORT || Number.isNaN(frontendPort)) {
    throw new Error(`Invalid or missing VITE_PORT: ${env.VITE_PORT ?? ""}`);
  }

  return {
    plugins: [react()],
    base: "/", // 👈 important for correct routing on deployment
    optimizeDeps: {
      include: [
        "jspdf",
        "jspdf-autotable",
        "html2canvas",
        "dompurify",
        "canvg",
      ],
    },
    server: {
      port: frontendPort,
      strictPort: true,
      proxy: {
        [`^/(${apiRoutes})(/|$)`]: {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
