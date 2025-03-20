import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCart, removeFromCart } from "../redux/cartSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CartPage = () => {
  const cartItems = useSelector((state) => state.cart.items) || [];
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user?.token) {
      dispatch(fetchCart()); // Fetch cart only if user is logged in
    }
  }, [dispatch, user?.token]);

  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);

  const handleRemove = async (id, name) => {
    try {
      await dispatch(removeFromCart(id));
      toast.error(`${name} removed from cart!`, { position: "top-right", autoClose: 2000 });
    } catch (error) {
      toast.error("Failed to remove item. Try again!", { position: "top-right", autoClose: 2000 });
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
                  src={item.image_url?.startsWith("http") ? item.image_url : `http://localhost:5000${item.image_url}`}
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
          <h3>Total: ${totalPrice.toFixed(2)}</h3>
        </>
      )}
    </div>
  );
};

export default CartPage;
