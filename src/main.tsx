import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ThemeProvider from "./theme/ThemeProvider.tsx";
import RouterProvider from "./router/Router.tsx";
import { AuthProvider } from "./Auth/Context/AuthContext.tsx";
import { AccountsCodingProvider } from "./Dashboard/Context/AccountsCodingContext.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AccountsCodingProvider>
          <RouterProvider />
        </AccountsCodingProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
