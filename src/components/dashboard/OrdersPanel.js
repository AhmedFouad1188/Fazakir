import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const OrdersPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/orders", { withCredentials: true });
        setOrders(res.data);
      } catch (err) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;

  return (
    <div>
      <h2>Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul>
          {orders.map((o) => (
            <li key={o.order_id}>Order #{o.order_id} - {o.status} - {new Date(o.created_at).toLocaleString()}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrdersPanel;