import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Cart = () => {
  const cartItems = useSelector((state) => state.cart);

  return (
    <div style={{ position: "relative", padding: "10px" }}>
      <Link to="/cart" style={{ textDecoration: "none", color: "black" }}>
        🛒 Cart ({cartItems.length})
      </Link>
    </div>
  );
};

export default Cart;
