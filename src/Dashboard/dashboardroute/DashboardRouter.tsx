import type { RouteObject } from "react-router";
import DashboardLayout from "../dashboardlayout/DashboardLayout";

import SalesInvoice from "../Pages/Invoicing/SalesInvoice";
import PurchaseInvoice from "../Pages/Invoicing/PurchaseInvoice";
import PurchaseReturns from "../Pages/Invoicing/PurchaseReturns";
import CreditSaleInvoice from "../Pages/Invoicing/CreditSaleInvoice";
import DeliveryChallans from "../Pages/Invoicing/DeliveryChallans";
import SaleReturns from "../Pages/Invoicing/SaleReturns";
import Products from "../Pages/Inventory/Products";
import StockLedger from "../Pages/Inventory/StockLedger";
import StockReports from "../Pages/Inventory/StockReports";
import GeneralLedger from "../Pages/Ledger&Reports/GeneralLedger";
import SalesLedger from "../Pages/Ledger&Reports/SalesLedger";
import PurchaseLedger from "../Pages/Ledger&Reports/PurchaseLedger";
import AccountsReceivable from "../Pages/Ledger&Reports/AccountsReceivable";
import CashBook from "../Pages/Accounts/CashBook";
import AccountsPayable from "../Pages/Ledger&Reports/AccountsPayable";
import TrialBalance from "../Pages/Ledger&Reports/TrialBalance";
import JournalVouchers from "../Pages/Accounts/JournalVouchers";
import GSTInvoices from "../Pages/Tax & Invoices/GstInvoices";
import Analytics from "../Pages/Analytics/Analytics";
import DashboardHome from "../Pages/DashboardHome";

import ManageCompanies from "../Pages/Company & Users/ManageCompanies";
import ManageUsers from "../Pages/Company & Users/ManageUsers";
import Permissions from "../Pages/Company & Users/Permissions";
import AccountsOpeningBalances from "../Pages/Chart of Accounts/AccountsOpeningBalances";
import ChartOfAccounts from "../Pages/Chart of Accounts/ChartOfAccounts";
const routes: RouteObject[] = [
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      {
        path: "dashboard-home",
        element: <DashboardHome />,
      },
      {
        path: "manage-companies",
        element: <ManageCompanies />,
      },
      {
        path: "manage-users",
        element: <ManageUsers />,
      },
      {
        path: "permissions",
        element: <Permissions />,
      },
      // -------------Chart of Accounts & Opening Balances------------------
      {
        path: "chart-of-accounts",
        element: <ChartOfAccounts />,
      },
      {
        path: "accounts-opening-balances",
        element: <AccountsOpeningBalances />,
      },
      // -------------Invoicing------------------
      { path: "sales-invoice", element: <SalesInvoice /> },
      {
        path: "purchase-invoice",
        element: <PurchaseInvoice />,
      },
      {
        path: "purchase-returns",
        element: <PurchaseReturns />,
      },
      {
        path: "credit-sale-invoice",
        element: <CreditSaleInvoice />,
      },
      {
        path: "sale-returns",
        element: <SaleReturns />,
      },
      {
        path: "delivery-challans",
        element: <DeliveryChallans />,
      },
      // -------------Inventory------------------
      {
        path: "products",
        element: <Products />,
      },
      {
        path: "stock-ledger",
        element: <StockLedger />,
      },
      {
        path: "stock-reports",
        element: <StockReports />,
      },
      {
        path: "general-ledger",
        element: <GeneralLedger />,
      },
      {
        path: "sales-ledger",
        element: <SalesLedger />,
      },
      {
        path: "purchase-ledger",
        element: <PurchaseLedger />,
      },
      {
        path: "accounts-receivable",
        element: <AccountsReceivable />,
      },
      {
        path: "accounts-payable",
        element: <AccountsPayable />,
      },
      {
        path: "trial-balance",
        element: <TrialBalance />,
      },
      // -------------Account--------------------
      {
        path: "cash-book",
        element: <CashBook />,
      },
      {
        path: "journal-vouchers",
        element: <JournalVouchers />,
      },
      // --------------Tax & Invoices--------------
      {
        path: "gst-invoices",
        element: <GSTInvoices />,
      },
      // --------------Analytics--------------
      {
        path: "analytics",
        element: <Analytics />,
      },
    ],
  },
];
export default routes;
