import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../Auth/Context/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
