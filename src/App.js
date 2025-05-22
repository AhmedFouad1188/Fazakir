import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuthState } from "./redux/authSlice";
import { fetchCart } from "./redux/cartSlice";
import Home from "./pages/home";
import Products from "./pages/products";
import ProductPage from "./pages/productPage";
import CartPage from "./pages/cart";
import Checkout from "./pages/checkout";
import ThankYou from "./pages/thankyou";
import Orders from "./pages/orders";
import Dashboard from "./pages/dashboard";
import Login from "./pages/login";
import ForgotPassword from "./pages/forgotPassword";
import Signup from "./pages/signup";
import Account from "./pages/account";
import RecoverAccount from "./pages/recoverAccount";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import ProtectedRoute from "./components/protectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import 'bootstrap/dist/css/bootstrap.min.css';

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
        <Route path="/product/:id" element={<ProductPage />} />
        
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
        <Route path="/forgotpass" element={<ForgotPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/recoveracc" element={<RecoverAccount />} />
      </Routes>
      <Footer />
      </>
  );
}

export default App;
