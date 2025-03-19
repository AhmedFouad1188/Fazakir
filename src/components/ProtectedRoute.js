import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const { user } = useAuth();
  const reduxUser = useSelector((state) => state.auth.user);

  if (reduxUser === undefined && user === undefined) return <p>Loading...</p>; // ✅ Wait before redirecting

  return reduxUser || user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
