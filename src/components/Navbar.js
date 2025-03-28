import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import Cart from "../components/Cart"; // ✅ Import Cart component

const Navbar = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    dispatch(logout());
    navigate("/login"); // ✅ Redirect to login page after logout
  };

  return (
    <nav style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      padding: "15px 20px", 
      background: "#333", 
      color: "#fff" 
    }}>
      {/* Logo/Home Link */}
      <Link to="/" style={{ color: "#fff", textDecoration: "none", fontSize: "22px", fontWeight: "bold" }}>
        🛍️ فذكر
      </Link>

      {/* Navigation Links */}
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link to="/shop" style={{ color: "#fff", textDecoration: "none" }}>Shop</Link>

        {/* Cart Link with Badge */}
        <Cart /> {/* ✅ Show cart icon with count */}

        {user ? (
          <>
            <Link to="/profile" style={{ color: "#fff", textDecoration: "none" }}>Profile</Link>
            <button 
              onClick={handleLogout} 
              style={{ 
                background: "red", 
                color: "#fff", 
                border: "none", 
                padding: "8px 12px", 
                cursor: "pointer", 
                borderRadius: "5px" 
              }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{ color: "#fff", textDecoration: "none" }}>Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
