import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import Cart from "../components/Cart"; // ✅ Import Cart component

const Navbar = () => {
  const { user, logout } = useAuth();
  const totalItems = useSelector((state) => state.cart.totalQuantity); // Get total quantity from Redux

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
            <Link to="/account" style={{ color: "#fff", textDecoration: "none" }}>Account</Link>
            <button 
              onClick={logout} 
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
