import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadCart } from "./redux/cartSlice";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/forgot-password";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import { CartProvider } from "./context/CartContext"; // Import CartProvider
import "./styles.css"

function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user?.user); // Get user from Redux
  
  useEffect(() => {
    if (user) {
      dispatch(loadCart(user.id));
    }
  }, [user, dispatch]);
  
  return (
    <AuthProvider>
    <CartProvider> {/* Wrap everything with CartProvider */}
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/account" element={user ? <Account /> : <Login />} />
          <Route path="/admin" element={<Dashboard />} />
        </Routes>
        <Footer />
      </Router>
    </CartProvider>
    </AuthProvider>
  );
}

export default App;
