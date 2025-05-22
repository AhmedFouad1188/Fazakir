import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, cancelOrder, orderAgain } from "../redux/orderSlice";
import EditOrderModal from "../components/editOrderModal";
import { toast } from "react-toastify";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import styles from "../styles/orders.module.css";

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
    <div className={styles.container}>
      <h2>طلبـــــاتــك</h2>
      {orders.map((order) => (
        <div key={order.id} className={styles.order}>
          <p><strong>رقم الطلب :</strong> {order.id}</p>
          <p><strong>حالة الطلب :</strong> {order.status}</p>
          <p><strong>وقت الطلب :</strong> {new Date(order.created_at).toLocaleString()}</p>
          <p><strong>إجمالى :</strong> {order.total_price}</p>
          <p><strong>طريقة الدفع :</strong> {order.payment_method}</p>
          <div className={styles.orderdet}>
            {order.items.map((item) => (
              <div key={item.product_id}>
                <img
                  src={item.image_url && item.image_url.startsWith("http") ? item.image_url : `http://localhost:5000${item.image_url || ""}`}
                  alt={item.name}
                  onClick={() => navigate(`/product/${item.product_id}`)}
                />
                {item.name} - {item.quantity} × {item.price}
              </div>
            ))}
          </div>
          {order.payment_method === "Cash on Delivery" && order.status === "placed" && (
            <>
              <button
                onClick={() => handleEditClick(order)}
              >
                Edit
              </button>
              <button
                onClick={() => handleCancel(order)}
              >
                Cancel
              </button>
            </>
          )}
          {order.payment_method === "Cash on Delivery" && order.status === "preparing" && (
            <>
              <button
                onClick={() => handleCancel(order)}
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
