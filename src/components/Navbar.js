import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import Cart from "../components/cart"; // ✅ Import Cart component
import logo from '../assets/logo.png';

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
      flexDirection: "row-reverse",
      justifyContent: "space-between", 
      alignItems: "center", 
      padding: "15px 20px", 
    }}>
      <Link to="/">
        <img src={logo} alt="Fazakir Logo" style={{width: "11vw", marginLeft: "1vw"}} />
      </Link>

      {/* Navigation Links */}
      <div style={{ display: "flex", flexDirection: "row-reverse", gap: "2vw", alignItems: "center", marginBottom: "11vw", marginRight: "2vw", fontWeight: "600" }}>

        <Cart /> {/* ✅ Show cart icon with count */}

        {user ? (
          <>
            <Link to="/orders" style={{ color: "#a38483", textDecoration: "none" }}>الطلبـــات</Link>
            <Link to="/account" style={{ color: "#a38483", textDecoration: "none" }}>الحســـاب</Link>
            {user.is_admin && (
              <Link to="/admin" style={{ color: "#a38483", textDecoration: "none" }}>لوحة تحكم الأدمن</Link>
            )}
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
              الـخـــروج
            </button>
          </>
        ) : (
          <Link to="/login" style={{ color: "#a38483", textDecoration: "none" }}>تسجيل الدخول</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
