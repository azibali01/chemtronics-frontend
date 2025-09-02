import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ThemeProvider from "./theme/ThemeProvider.tsx";
import RouterProvider from "./router/Router.tsx";
import { AuthProvider } from "./Auth/Context/AuthContext.tsx";
import { CompanyProvider } from "./Dashboard/Context/Company & Users/CompanyContext.tsx";
import { UserProvider } from "./Dashboard/Context/Company & Users/UserContext.tsx";
import { PermissionProvider } from "./Dashboard/Context/Company & Users/PermissionContext.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CompanyProvider>
          <UserProvider>
            <PermissionProvider>
              <RouterProvider />
            </PermissionProvider>
          </UserProvider>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
