import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ThemeProvider from "./theme/ThemeProvider.tsx";
import RouterProvider from "./router/Router.tsx";
import { AuthProvider } from "./Auth/Context/AuthContext.tsx";
import { CompanyProvider } from "./Dashboard/Context/Company & Users/CompanyContext.tsx";
import { UserProvider } from "./Dashboard/Context/Company & Users/UserContext.tsx";
import { PermissionProvider } from "./Dashboard/Context/Company & Users/PermissionContext.tsx";
import { PurchaseInvoiceProvider } from "./Dashboard/Context/Invoicing/PurchaseInvoiceContext.tsx";
import { SalesInvoiceProvider } from "./Dashboard/Context/Invoicing/SalesInvoiceContext.tsx";
import { PurchaseReturnsProvider } from "./Dashboard/Context/Invoicing/PurchaseReturnsContext.tsx";
import { DeliveryChallanProvider } from "./Dashboard/Context/Invoicing/DeliveryChallanContext.tsx";
import { CreditSalesProvider } from "./Dashboard/Context/Invoicing/CreditSalesContext.tsx";
import { SaleReturnsProvider } from "./Dashboard/Context/Invoicing/SaleReturnsContext.tsx";
import { JournalVouchersProvider } from "./Dashboard/Context/Accounts/JournalVouchersContext.tsx"; // <-- Add this import
import { ChartOfAccountsProvider } from "./Dashboard/Context/ChartOfAccountsContext";
import { DashboardHomeProvider } from "./Dashboard/Context/DashboardHomeContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CompanyProvider>
          <UserProvider>
            <PermissionProvider>
              <PurchaseInvoiceProvider>
                <SalesInvoiceProvider>
                  <PurchaseReturnsProvider>
                    <DeliveryChallanProvider>
                      <CreditSalesProvider>
                        <SaleReturnsProvider>
                          <JournalVouchersProvider>
                            <ChartOfAccountsProvider>
                              <DashboardHomeProvider>
                                <RouterProvider />
                              </DashboardHomeProvider>
                            </ChartOfAccountsProvider>
                          </JournalVouchersProvider>
                        </SaleReturnsProvider>
                      </CreditSalesProvider>
                    </DeliveryChallanProvider>
                  </PurchaseReturnsProvider>
                </SalesInvoiceProvider>
              </PurchaseInvoiceProvider>
            </PermissionProvider>
          </UserProvider>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
