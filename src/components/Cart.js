import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Cart = () => {
  const cart = useSelector((state) => state.cart); // ✅ Get full cart state
  const totalQuantity = cart?.totalQuantity || 0; // ✅ Safe access

  return (
    <div style={{ position: "relative", padding: "10px" }}>
      <Link to="/cart" style={{ textDecoration: "none", color: "#a38483" }}>
        🛒 {totalQuantity} {/* ✅ Display cart count safely */}
      </Link>
    </div>
  );
};

export default Cart;
