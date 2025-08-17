import type { RouteObject } from "react-router";
import AuthLayout from "../Layout/AuthLayout";
import Login from "../Pages/Login";

const routes: RouteObject[] = [
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Login />,
      },
    ],
  },
];
export default routes;
