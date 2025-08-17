import type { RouteObject } from "react-router";
import DashboardLayout from "../dashboardlayout/DashboardLayout";
import PurchaseInvoice from "../Pages/PurchaseInvoice";
const routes: RouteObject[] = [
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      {
        path: "purchase-invoice",
        element: <PurchaseInvoice />,
      },
    ],
  },
];
export default routes;
