import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import ProductsPanel from "../components/dashboard/ProductsPanel";
import UsersPanel from "../components/dashboard/UsersPanel";
import OrdersPanel from "../components/dashboard/OrdersPanel";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isLoading = useSelector((state) => state.auth.isLoading);

  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      toast.error("Please log in.");
      navigate("/login");
    } else if (!user.is_admin) {
      toast.error("Access denied: Admins only.");
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  const renderPanel = () => {
    switch (activeTab) {
      case "products":
        return <ProductsPanel />;
      case "users":
        return <UsersPanel />;
      case "orders":
        return <OrdersPanel />;
      default:
        return <ProductsPanel />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: "220px", background: "#2d2d2d", color: "#fff", padding: "20px" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "30px" }}>Admin Dashboard</h2>
        <button
          onClick={() => setActiveTab("products")}
          style={{
            background: activeTab === "products" ? "#444" : "transparent",
            color: "#fff",
            border: "none",
            padding: "10px 15px",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab("users")}
          style={{
            background: activeTab === "users" ? "#444" : "transparent",
            color: "#fff",
            border: "none",
            padding: "10px 15px",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          style={{
            background: activeTab === "orders" ? "#444" : "transparent",
            color: "#fff",
            border: "none",
            padding: "10px 15px",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          Orders
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "20px" }}>
        {renderPanel()}
      </div>
    </div>
  );
};

export default Dashboard;
