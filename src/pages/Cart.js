import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCart, removeFromCart } from "../redux/cartSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CartPage = () => {
  const cartItems = useSelector((state) => state.cart.items) || []; // ✅ Ensure it's always an array
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user); // ✅ Ensure user is logged in

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCart()); // ✅ Ensure user ID exists before fetching
    }
  }, [dispatch, user?.id]); // ✅ Depend on `user?.id`

  const totalPrice = cartItems.reduce((acc, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    return acc + price * quantity;
  }, 0);

  const handleRemove = async (id, name) => {
    try {
      await dispatch(removeFromCart(id));
      toast.error(`${name} removed from cart!`, { position: "top-right", autoClose: 2000 });
    } catch (error) {
      toast.error("Failed to remove item. Try again!", { position: "top-right", autoClose: 2000 });
      console.error("Remove Error:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Shopping Cart</h2>
      <ToastContainer />

      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul>
            {cartItems.map((item) => (
              <li key={item.id} style={{ marginBottom: "10px" }}>
                <img
                  src={item.image_url?.startsWith("http") ? item.image_url : `http://localhost:5000${item.image_url}`} // ✅ Ensure correct image URL
                  alt={item.name}
                  style={{ width: "15vw", objectFit: "cover", borderRadius: "5px" }}
                />
                {item.name} - ${Number(item.price || 0).toFixed(2)} x {item.quantity}
                <button onClick={() => handleRemove(item.id, item.name)} style={{ marginLeft: "10px" }}>
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
