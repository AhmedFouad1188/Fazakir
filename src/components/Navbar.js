import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";

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
        🛍️ MyShop
      </Link>

      {/* Navigation Links */}
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link to="/shop" style={{ color: "#fff", textDecoration: "none" }}>Shop</Link>

        {/* Cart Link with Badge */}
        <Link to="/cart" style={{ 
          color: "#fff", 
          textDecoration: "none", 
          position: "relative", 
          fontSize: "18px" 
        }}>
          🛒 Cart
          {totalItems > 0 && (
            <span style={{
              position: "absolute",
              top: "-8px",
              right: "-12px",
              background: "red",
              color: "#fff",
              borderRadius: "50%",
              padding: "5px 10px",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              {totalItems}
            </span>
          )}
        </Link>

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
