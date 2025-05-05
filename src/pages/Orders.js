import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, cancelOrder, orderAgain } from "../redux/orderSlice";
import EditOrderModal from "../components/editOrderModal";
import { toast } from "react-toastify";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders = [], loading, error } = useSelector((state) => state.order || {});
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleEditClick = (order) => {
    setSelectedOrder(order);
  };

  const handleCancel = (order) => {
      confirmAlert({
        title: 'Cancel Order ?',
        message: `Are you sure you want to cancel Order no. ${order.id} ?`,
        buttons: [
          {
            label: 'Yes',
            onClick: async () => {
              try {
                await dispatch(cancelOrder({orderId: order.id})).unwrap();
                toast.error(`Order cancelled successfully`, {
                  position: "top-right",
                  autoClose: 2000,
                });
              } catch (error) {
                toast.error("Failed to cancel order. Try again!", {
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

  const handleOrderAgain = (order) => {
    confirmAlert({
      title: 'Order Again ?',
      message: `Are you sure you want to make this order again ?`,
      buttons: [
        {
          label: 'Yes',
          onClick: async () => {
            try {
              await dispatch(orderAgain({orderId: order.id})).unwrap();
              toast.success(`Order placed successfully`, {
                position: "top-right",
                autoClose: 2000,
              });
            } catch (error) {
              toast.error("Failed to place order. Try again!", {
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Your Orders</h2>
      {orders.map((order) => (
        <div key={order.id} className="border rounded p-4 mb-4">
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Created at:</strong> {new Date(order.created_at).toLocaleString()}</p>
          <p><strong>Total:</strong> {order.total_price}</p>
          <p><strong>Payment Method:</strong> {order.payment_method}</p>
          <ul className="mt-2">
            {order.items.map((item) => (
              <li key={item.product_id}>
                <img
                  src={item.image_url && item.image_url.startsWith("http") ? item.image_url : `http://localhost:5000${item.image_url || ""}`}
                  alt={item.name}
                  style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "5px", marginRight: "15px", cursor: "pointer" }}
                  onClick={() => navigate(`/product/${item.product_id}`)}
                />
                {item.name} - {item.quantity} × {item.price}
              </li>
            ))}
          </ul>
          {order.payment_method === "Cash on Delivery" && order.status === "placed" && (
            <>
              <button
                onClick={() => handleEditClick(order)}
                className="mt-2 bg-yellow-500 text-white px-4 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleCancel(order)}
                className="ml-2 mt-2 bg-red-600 text-white px-4 py-1 rounded"
              >
                Cancel
              </button>
            </>
          )}
          {order.payment_method === "Cash on Delivery" && order.status === "preparing" && (
            <>
              <button
                onClick={() => handleCancel(order)}
                className="ml-2 mt-2 bg-red-600 text-white px-4 py-1 rounded"
              >
                Cancel
              </button>
            </>
          )}
          {order.payment_method === "Cash on Delivery" && order.status === "cancelled" && (
            <>
              <button onClick={() => handleOrderAgain(order)}>Order Again</button>
            </>
          )}
        </div>
      ))}
      {selectedOrder && (
        <EditOrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default Orders;
