import type { RouteObject } from "react-router";
import DashboardLayout from "../dashboardlayout/DashboardLayout";
import PurchaseInvoice from "../Pages/Invoices/PurchaseInvoice";
import PurchaseInvoiceGST from "../Pages/Invoices/PurchaseInvoiceGST";
import PurchaseInvoiceReturn from "../Pages/Invoices/PurchaseInvoiceReturn";
import CashSaleInvoice from "../Pages/Invoices/CashSaleInvoice";
import CreditSaleInvoice from "../Pages/Invoices/CreditSaleInvoice";
import SaleReturn from "../Pages/Invoices/SaleReturn";
import SaleReturnWithInvoice from "../Pages/Invoices/SaleReturnWithInvoice";
import CashPaymentDebitVoucher from "../Pages/Accounts/CashPaymentDebitvoucher";
import CashReceiptCreditVoucher from "../Pages/Accounts/CashReceiptCreditVoucher";
import CashWholeSaleInvoice from "../Pages/Invoices/CashWholeSaleInvoice";
import CreditWholeSaleInvoice from "../Pages/Invoices/CreditWholeSaleInvoice";
import WholeSaleReturn from "../Pages/Invoices/WholeSaleReturn";
import WholeSaleReturnWithInvoice from "../Pages/Invoices/WholeSaleReturnWithinvoice";
import JournalVoucher from "../Pages/Accounts/JournalVoucher";
import BankCreditVoucher from "../Pages/Accounts/BankCreditVoucher";
import BankDebitVoucher from "../Pages/Accounts/BankDebitVoucher";
import SalesCommission from "../Pages/Accounts/SalesCommission";
import AccountsLedger from "../Pages/Accounts Report/AccountLedger";
import CashBook from "../Pages/Accounts Report/CashBook";
import DayBook from "../Pages/Accounts Report/DayBook";
import JournalBook from "../Pages/Accounts Report/JournalBook";
import BalanceSheet from "../Pages/Accounts Report/BalanceSheet";
import RecieveablePayableAmount from "../Pages/Accounts Report/RecieveablePayableAmount";
import ProfitLoss from "../Pages/Accounts Report/ProfitLoss";
import ShortTrialBalance from "../Pages/Trial Balance/ShortTrialBalance";
import TrialBalanceBetweenDates from "../Pages/Trial Balance/TrialBalanceBetweenDates";
import GroupTrial from "../Pages/Trial Balance/GroupTrial";
import DetailTrial from "../Pages/Trial Balance/DetailTrail";
import SixColumnTrial from "../Pages/Trial Balance/SixColumnTrial";
import DailyGrossProfit from "../Pages/Inventory Report/DailyGrossProfit";
import StockLedger from "../Pages/Inventory Report/StockLedger";
import StockInHand from "../Pages/Inventory Report/StockInHand";
import ProductPurchase from "../Pages/Product Reports/ProductPurchase";
import ProductSale from "../Pages/Product Reports/ProductSale";
import PartyWiseProductSale from "../Pages/Product Reports/PartyWiseProductSale";
import CreateUser from "../Pages/System/CreateUser";
import UserRights from "../Pages/System/UserRights";
import AccountsCoding from "../Pages/Coding/AccountsCoding";
const routes: RouteObject[] = [
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      {
        path: "purchase-invoice",
        element: <PurchaseInvoice />,
      },
      {
        path: "purchase-invoice-GST",
        element: <PurchaseInvoiceGST />,
      },
      {
        path: "purchase-invoice-return",
        element: <PurchaseInvoiceReturn />,
      },
      {
        path: "cash-sale-invoice",
        element: <CashSaleInvoice />,
      },
      {
        path: "credit-sale-invoice",
        element: <CreditSaleInvoice />,
      },
      {
        path: "sale-return",
        element: <SaleReturn />,
      },
      {
        path: "sale-return-with-invoice",
        element: <SaleReturnWithInvoice />,
      },
      {
        path: "cash-payment-debit-voucher",
        element: <CashPaymentDebitVoucher />,
      },
      {
        path: "cash-receipt-credit-voucher",
        element: <CashReceiptCreditVoucher />,
      },
      {
        path: "cash-wholesale-invoice",
        element: <CashWholeSaleInvoice />,
      },
      {
        path: "credit-wholesale-invoice",
        element: <CreditWholeSaleInvoice />,
      },
      {
        path: "whole-sale-return",
        element: <WholeSaleReturn />,
      },
      {
        path: "whole-sale-return-with-invoice",
        element: <WholeSaleReturnWithInvoice />,
      },
      {
        path: "journal-voucher",
        element: <JournalVoucher />,
      },
      {
        path: "bank-credit-voucher",
        element: <BankCreditVoucher />,
      },
      {
        path: "bank-debit-voucher",
        element: <BankDebitVoucher />,
      },
      {
        path: "sales-commission",
        element: <SalesCommission />,
      },
      // Account ledger
      {
        path: "account-ledger",
        element: <AccountsLedger />,
      },
      {
        path: "cash-book",
        element: <CashBook />,
      },
      {
        path: "day-book",
        element: <DayBook />,
      },
      {
        path: "journal-book",
        element: <JournalBook />,
      },
      {
        path: "balance-sheet",
        element: <BalanceSheet />,
      },
      {
        path: "receivable-payable-amount",
        element: <RecieveablePayableAmount />,
      },
      {
        path: "profit-loss",
        element: <ProfitLoss />,
      },
      // --Trial Balance--
      {
        path: "short-trial-balance",
        element: <ShortTrialBalance />,
      },
      {
        path: "trial-balance-between-dates",
        element: <TrialBalanceBetweenDates />,
      },
      {
        path: "group-trial",
        element: <GroupTrial />,
      },
      {
        path: "detail-trial",
        element: <DetailTrial />,
      },
      {
        path: "six-column-trial",
        element: <SixColumnTrial />,
      },
      {
        path: "daily-gross-profit",
        element: <DailyGrossProfit />,
      },
      {
        path: "stock-ledger",
        element: <StockLedger />,
      },
      {
        path: "stock-in-hand",
        element: <StockInHand />,
      },
      {
        path: "product-purchase",
        element: <ProductPurchase />,
      },
      {
        path: "product-sale",
        element: <ProductSale />,
      },
      {
        path: "party-wise-product-sale",
        element: <PartyWiseProductSale />,
      },
      // --System--
      {
        path: "create-user",
        element: <CreateUser />,
      },
      {
        path: "user-rights",
        element: <UserRights />,
      },
      // --Coding--
      {
        path: "accounts-coding",
        element: <AccountsCoding />,
      },
    ],
  },
];
export default routes;
