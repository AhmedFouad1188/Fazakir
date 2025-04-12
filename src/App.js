import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuthState } from "./redux/authSlice";
import { fetchCart } from "./redux/cartSlice";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/forgot-password";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import RecoverAccount from "./pages/recover-account";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles.css";

function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user); 

  // ✅ Ensure authentication persists after page refresh
  useEffect(() => {
    dispatch(checkAuthState()); 
  }, [dispatch]);

  // ✅ Fetch cart after authentication
  useEffect(() => {
    if (user) {
      dispatch(fetchCart(user.uid)); 
    }
  }, [user, dispatch]);

  return (
    <CartProvider> {/* Wrap everything with CartProvider */}
      <ToastContainer />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        
        {/* ✅ Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<Account />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        {/* ✅ Admin Dashboard (Protected) */}
        <Route element={<ProtectedRoute isAdmin={true} />}>
          <Route path="/admin" element={<Dashboard />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/recover-account" element={<RecoverAccount />} />
      </Routes>
      <Footer />
    </CartProvider>
  );
}

export default App;
