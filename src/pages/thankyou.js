import React from "react";
import { useNavigate } from "react-router-dom";

const ThankYou = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "70vh", 
      padding: "20px", 
      textAlign: "center" 
    }}>
      <h2 style={{ color: "#28a745" }}>Thank you for purchasing from Fazakir.com!</h2>
      <p style={{ marginTop: "10px", fontSize: "18px" }}>
        Your order is in progress. We will send you messages to keep you updated with your order status.
      </p>

      <div style={{ marginTop: "30px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <button 
          onClick={() => navigate("/orders")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Check Your Orders
        </button>

        <span style={{ fontWeight: "bold", fontSize: "16px" }}>or</span>

        <button 
          onClick={() => navigate("/")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default ThankYou;
