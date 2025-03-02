import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) {
    return <p>You must be logged in to view this page.</p>;
  }

  return (
    <div>
      <h2>Welcome, {user.email}!</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Account;
