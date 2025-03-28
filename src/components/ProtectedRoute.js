import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ isAdmin = false }) => {
  const user = useSelector((state) => state.auth.user);
  const isLoading = useSelector((state) => state.auth.isLoading);

  if (isLoading) return <p>Loading...</p>;

  // Redirect to login if no user is found
  if (!user) return <Navigate to="/login" />;

  // If `isAdmin` is required and the user is not an admin, redirect to home
  if (isAdmin && !user.is_admin) return <Navigate to="/" />;

  return <Outlet />;
};

export default ProtectedRoute;
