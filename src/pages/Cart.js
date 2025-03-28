import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCart, removeFromCart } from "../redux/cartSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CartPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  // ✅ Ensure state.cart is always defined
  const cartState = useSelector((state) => state.cart || { items: [] });
  const cartItems = cartState.items || [];

  useEffect(() => {
    if (user?.token) {
      dispatch(fetchCart());
    }
  }, [dispatch, user?.token]);

  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);

  const handleRemove = async (id, name) => {
    try {
      await dispatch(removeFromCart(id)).unwrap();
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
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {cartItems.map((item) => (
              <li key={item.id} style={{ marginBottom: "15px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={item.image_url && item.image_url.startsWith("http") ? item.image_url : `http://localhost:5000${item.image_url || ""}`}
                  alt={item.name}
                  style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "5px", marginRight: "15px" }}
                />
                <span>
                  {item.name} - ${Number(item.price || 0).toFixed(2)} x {item.quantity}
                </span>
                <button 
                  onClick={() => handleRemove(item.id, item.name)} 
                  style={{ marginLeft: "15px", background: "red", color: "white", border: "none", padding: "5px 10px", cursor: "pointer", borderRadius: "5px" }}
                >
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
