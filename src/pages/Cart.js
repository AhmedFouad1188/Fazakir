import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchCart, removeFromCart, updateCartQuantity } from "../redux/cartSlice"; // reuse addToCart
import { toast } from "react-toastify";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.items || []);

  useEffect(() => {
    if (user?.token) {
      dispatch(fetchCart());
    }
  }, [dispatch, user?.token]);

  const handleRemove = (product_id, name) => {
    confirmAlert({
      title: 'Confirm to remove',
      message: `Are you sure you want to remove "${name}" from the cart?`,
      buttons: [
        {
          label: 'Yes',
          onClick: async () => {
            try {
              await dispatch(removeFromCart(product_id)).unwrap();
              toast.error(`${name} removed from cart!`, {
                position: "top-right",
                autoClose: 2000,
              });
            } catch (error) {
              toast.error("Failed to remove item. Try again!", {
                position: "top-right",
                autoClose: 2000,
              });
            }
          }
        },
        {
          label: 'No'
          // No action needed; this closes the dialog
        }
      ]
    });
  };

  const handleIncrease = async (item) => {  
    try {
      await dispatch(updateCartQuantity({ productId: item.product_id, quantity: item.quantity + 1 })).unwrap(); // add 1 to DB
    } catch (error) {
      toast.error("Failed to increase quantity.");
    }
  };
  
  const handleDecrease = async (item) => {
    if (item.quantity <= 1) return;
  
    try {
      await dispatch(updateCartQuantity({ productId: item.product_id, quantity: item.quantity - 1 })).unwrap();
    } catch (error) {
      toast.error("Failed to decrease quantity.");
    }
  };  

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  );

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {cartItems.map((item) => (
              <li
                key={item.product_id}
                style={{ marginBottom: "15px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <img
                  src={item.image_url && item.image_url.startsWith("http") ? item.image_url : `http://localhost:5000${item.image_url || ""}`}
                  alt={item.name}
                  style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "5px", marginRight: "15px", cursor: "pointer" }}
                  onClick={() => navigate(`/product/${item.product_id}`)}
                />
                <span style={{ marginRight: "15px" }}>
                  {item.name} - {Number(item.price || 0).toFixed(2)}
                </span>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <button onClick={() => handleDecrease(item)} disabled={item.quantity <= 1} style={{ marginRight: "5px", opacity: item.quantity <= 1 ? 0.5 : 1, cursor: item.quantity <= 1 ? "not-allowed" : "pointer" }}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleIncrease(item)} style={{ marginLeft: "5px" }}>+</button>
                </div>

                <button 
                  onClick={() => handleRemove(item.product_id, item.name)} 
                  style={{ marginLeft: "15px", background: "red", color: "white", border: "none", padding: "5px 10px", cursor: "pointer", borderRadius: "5px" }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <h3>Total: {totalPrice.toFixed(2)}</h3>
          <button 
            onClick={() => window.location.href = "/checkout"}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Place Your Order
          </button>
        </>
      )}
    </div>
  );
};

export default CartPage;
