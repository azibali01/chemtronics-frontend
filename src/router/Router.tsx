import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
} from "react-router";
import AuthRouter from "../Auth/router/AuthRouter";
import DashboardRouter from "../Dashboard/dashboardroute/DashboardRouter";
const router = createBrowserRouter([...AuthRouter, ...DashboardRouter]);

const RouterProvider = () => {
  return <ReactRouterProvider router={router}></ReactRouterProvider>;
};
export default RouterProvider;
