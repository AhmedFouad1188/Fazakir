import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { submitOrder, resetOrderState } from "../redux/orderSlice";
import { clearCart } from "../redux/cartSlice";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userInfo = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.items);
  const orderState = useSelector((state) => state.order);

  const requiredFields = [
    "firstname", "lastname", "email", "country",
    "dial_code", "mobile", "governorate", "street", "building"
  ];

  const isValid = requiredFields.every((field) => userInfo?.[field]);

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  );

  const handleConfirmOrder = () => {
    if (!isValid) {
      toast.error("Please fill all required fields before confirming your order.");
      return;
    }

    const orderData = {
      firebase_uid: userInfo.firebase_uid,
      shipping_details: {
        firstname: userInfo.firstname,
        lastname: userInfo.lastname,
        email: userInfo.email,
        country: userInfo.country,
        dial_code: userInfo.dial_code,
        mobile: userInfo.mobile,
        governorate: userInfo.governorate,
        district: userInfo.district,
        street: userInfo.street,
        building: userInfo.building,
        floor: userInfo.floor,
        apartment: userInfo.apartment,
        landmark: userInfo.landmark,
      },
      payment_method: "Cash on Delivery",
      products: cartItems.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        description: item.description,
        image_url: item.image_url,
        quantity: item.quantity,
        price: item.price,
      })),
      total_price: totalPrice,
    };
    
    dispatch(submitOrder(orderData));
  };

  useEffect(() => {
    if (orderState.success) {
      toast.success("Order placed successfully!", {
        onClose: () => {
          dispatch(clearCart());
          dispatch(resetOrderState());
          navigate("/thankyou");
        },
        autoClose: 2000,
      });
    }

    if (orderState.error) {
      toast.error(orderState.error);
    }
  }, [orderState.success, orderState.error, dispatch, navigate]);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Checkout</h2>
      <ToastContainer />

      <section style={{ marginBottom: "30px" }}>
        <h3>Shipping Information</h3>
        <button onClick={() => navigate("/account")}>Edit</button>
        <ul>
          {requiredFields.map((field) => (
            <li key={field}>
              <strong>{field.replace("_", " ")}:</strong>{" "}
              {userInfo?.[field] || <span style={{ color: "red" }}>Missing</span>}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h3>Order Review</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {cartItems.map((item) => (
            <li key={item.product_id} style={{ marginBottom: "10px" }}>
              {item.name} × {item.quantity} = ${Number(item.price * item.quantity).toFixed(2)}
            </li>
          ))}
        </ul>
        <h4>Total: ${totalPrice.toFixed(2)}</h4>
      </section>

      <section style={{ marginBottom: "20px" }}>
        <h3>Payment Method</h3>
        <p>Cash on Delivery</p>
      </section>

      <button
        onClick={handleConfirmOrder}
        disabled={orderState.loading}
        style={{
          padding: "10px 20px",
          backgroundColor: orderState.loading ? "gray" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: orderState.loading ? "not-allowed" : "pointer",
        }}
      >
        {orderState.loading ? "Placing Order..." : "Confirm Your Order"}
      </button>
    </div>
  );
};

export default Checkout;
