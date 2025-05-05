import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const OrdersPanel = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/orders/fetchAllOrders", { withCredentials: true });
        setOrders(res.data);
      } catch (err) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const toggleOrderItems = (orderId) => {
    setExpandedOrderId((prevId) => (prevId === orderId ? null : orderId));
  };

  const nextStatus = (current) => {
    switch (current) {
      case "placed": return "preparing";
      case "preparing": return "out for delivery";
      case "out for delivery": return "delivered";
      default: return null;
    }
  };  

  if (loading) return <p>Loading orders...</p>;

  return (
    <div>
      <h2>Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: "10px", padding: "5px", width: "300px" }}
          />
          <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Payment Method</th>
                <th>Total Price</th>
                <th>Name</th>
                <th>Country</th>
                <th>Mobile</th>
                <th>Governorate</th>
                <th>Created at</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter((o) =>
                  `${o.id} ${o.firstname} ${o.lastname} ${o.email} ${o.dial_code}${o.mobile} ${o.status}`
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((o) => (
                  <React.Fragment key={o.id}>
                    <tr
                      onClick={() => toggleOrderItems(o.id)}
                      style={{ cursor: "pointer", backgroundColor: expandedOrderId === o.id ? "#f9f9f9" : "white" }}
                    >
                      <td>{o.id}</td>
                      <td>{o.payment_method}</td>
                      <td>{o.total_price}</td>
                      <td>{o.firstname} {o.lastname}</td>
                      <td>{o.country}</td>
                      <td>{o.dial_code} {o.mobile}</td>
                      <td>{o.governorate}</td>
                      <td>{o.created_at}</td>
                      <td style={{
                        color:
                          o.status === "delivered"
                            ? "green"
                            : o.status === "cancelled"
                            ? "red"
                            : o.status === "placed"
                            ? "blue"
                            : "black"
                      }}>
                        {o.status}
                      </td>
                    </tr>

                    {/* Expanded order items row */}
                    {expandedOrderId === o.id && (
                      <tr>
                        <td colSpan="12">
                            <table border="1" style={{ width: "100%", marginTop: "10px" }}>
                              <thead>
                                <tr>
                                  <th>Email</th>
                                  <th>Address</th>
                                  <th>Landmark</th>
                                </tr>
                              </thead>
                              <tbody>
                                  <tr key={o.id}>
                                    <td>{o.email}</td>
                                    <td>{o.building} {o.street}, {o.district}, Floor: {o.floor}, Apt: {o.apartment}</td>
                                    <td>{o.landmark}</td>
                                  </tr>
                              </tbody>
                            </table>

                          <h4>Order Items</h4>
                          {o.items && o.items.length > 0 ? (
                            <><table border="1" style={{ width: "100%", marginTop: "10px" }}>
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Quantity</th>
                                  <th>Price</th>
                                  <th>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {o.items.map((item, index) => (
                                  <tr key={index}>
                                    <td><img
                                          src={item.image_url && item.image_url.startsWith("http") ? item.image_url : `http://localhost:5000${item.image_url || ""}`}
                                          alt={item.name}
                                          style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "5px", marginRight: "15px", cursor: "pointer" }}
                                          onClick={() => navigate(`/product/${item.product_id}`)}
                                        />{item.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.price}</td>
                                    <td>{item.quantity * item.price}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table><div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                                {o.status !== "delivered" && o.status !== "cancelled" && (
                                  <button
                                    onClick={async () => {
                                      const next = nextStatus(o.status);
                                      if (!next) return;
                                      try {
                                        await axios.put(`http://localhost:5000/api/orders/updateStatus/${o.id}`, { status: next }, { withCredentials: true });
                                        setOrders((prev) => prev.map((order) => order.id === o.id ? { ...order, status: next } : order
                                        )
                                        );
                                        toast.success(`Order marked as ${next}`);
                                      } catch {
                                        toast.error("Failed to update status");
                                      }
                                    } }
                                  >
                                    Mark as {nextStatus(o.status)}
                                  </button>
                                )}

                                {o.status !== "cancelled" && o.status !== "delivered" && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await axios.put(`http://localhost:5000/api/orders/cancel/${o.id}`, {}, { withCredentials: true });
                                        setOrders((prev) => prev.map((order) => order.id === o.id ? { ...order, status: "cancelled" } : order
                                        )
                                        );
                                        toast.success("Order cancelled");
                                      } catch {
                                        toast.error("Failed to cancel order");
                                      }
                                    } }
                                    style={{ backgroundColor: "#f44336", color: "white", border: "none", padding: "5px 10px" }}
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </div></>
                          ) : (
                            <p>No items found for this order.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default OrdersPanel;
