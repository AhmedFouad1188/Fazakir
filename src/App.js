import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuthState } from "./redux/authSlice";
import { fetchCart } from "./redux/cartSlice";
import Home from "./pages/Home";
import Products from "./pages/products";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ThankYou from "./pages/thankyou";
import Orders from "./pages/Orders";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ForgotPassword from "./pages/forgot-password";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import RecoverAccount from "./pages/recover-account";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    <>
      <ToastContainer />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        
        {/* ✅ Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<Account />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/thankyou" element={<ThankYou />} />
          <Route path="/orders" element={<Orders />} />
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
      </>
  );
}

export default App;
