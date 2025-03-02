import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useSelector } from "react-redux";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { CartProvider } from "./context/CartContext"; // Import CartProvider

function App() {
  const user = useSelector((state) => state.auth.user); // Get user from Redux
  
  return (
    <AuthProvider>
    <CartProvider> {/* Wrap everything with CartProvider */}
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/account" element={user ? <Account /> : <Login />} />
        </Routes>
        <Footer />
      </Router>
    </CartProvider>
    </AuthProvider>
  );
}

export default App;
