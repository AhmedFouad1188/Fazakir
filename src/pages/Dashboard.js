import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import ProductsPanel from "../components/dashboard/productsPanel";
import UsersPanel from "../components/dashboard/usersPanel";
import OrdersPanel from "../components/dashboard/ordersPanel";

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
    <div>
      <div className="dashbuttons">
        <button
          onClick={() => setActiveTab("products")}
          style={{
            borderBottom: activeTab === "products" ? "solid" : "none"
          }}
        >
          المنتجات
        </button>
        <button
          onClick={() => setActiveTab("users")}
          style={{
            borderBottom: activeTab === "users" ? "solid" : "none"
          }}
        >
          العملاء
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          style={{
            borderBottom: activeTab === "orders" ? "solid" : "none"
          }}
        >
          الطلبات
        </button>
      </div>

      {/* Main Content */}
      <div>
        {renderPanel()}
      </div>
    </div>
  );
};

export default Dashboard;
