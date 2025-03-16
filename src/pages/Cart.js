import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromCart } from "../redux/cartSlice";

const CartPage  = () => {
  const cartItems = useSelector((state) => state.cart.items) || []; // ✅ Ensure it's always an array
  const dispatch = useDispatch();

  // ✅ Ensure total price is always a valid number
  const totalPrice = cartItems.reduce((acc, item) => {
    const price = item.price || 0; // ✅ Prevent undefined price
    const quantity = item.quantity || 1; // ✅ Prevent undefined quantity
    return acc + price * quantity;
  }, 0);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul>
            {cartItems.map((item) => (
              <li key={item.id} style={{ marginBottom: "10px" }}>
                <img
                  src={`http://localhost:5000${item.image_url}`} // Ensure correct image path
                  alt={item.name}
                  style={{ width: "15vw", objectFit: "cover", borderRadius: "5px" }}
                />
                  {item.name} - ${Number(item.price || 0).toFixed(2)} x {item.quantity}
                <button onClick={() => dispatch(removeFromCart(item.id))} style={{ marginLeft: "10px" }}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <h3>Total: ${Number.isNaN(totalPrice) ? "0.00" : totalPrice.toFixed(2)}</h3> {/* ✅ Ensure valid number */}
        </>
      )}
    </div>
  );
};

export default CartPage;
