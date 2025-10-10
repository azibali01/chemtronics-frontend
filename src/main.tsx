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
import { JournalVouchersProvider } from "./Dashboard/Context/Accounts/JournalVouchersContext.tsx";
import { ChartOfAccountsProvider } from "./Dashboard/Context/ChartOfAccountsContext";
import { AccountsOpeningBalancesProvider } from "./Dashboard/Context/AccountsOpeningbalancesContext";
import { DashboardHomeProvider } from "./Dashboard/Context/DashboardHomeContext";
import { ProductsProvider } from "./Dashboard/Context/Inventory/ProductsContext";
import { StockReportsProvider } from "./Dashboard/Context/Inventory/StockReportsContext";
import { BrandProvider } from "./Dashboard/Context/BrandContext.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
          <BrandProvider>
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
                              <AccountsOpeningBalancesProvider>
                                <DashboardHomeProvider>
                                  <ProductsProvider>
                                    <StockReportsProvider>
                                      <RouterProvider />
                                    </StockReportsProvider>
                                  </ProductsProvider>
                                </DashboardHomeProvider>
                              </AccountsOpeningBalancesProvider>
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
        </BrandProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
