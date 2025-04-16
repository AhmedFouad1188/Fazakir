import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, cancelOrder, orderAgain } from "../redux/orderSlice";
import EditOrderModal from "../components/EditOrderModal";

const Orders = () => {
  const dispatch = useDispatch();
  const { orders = [], loading, error } = useSelector((state) => state.order || {});
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleEditClick = (order) => {
    setSelectedOrder(order);
  };

  const handleCancel = (order) => {
    const confirmed = window.confirm("Are you sure you want to cancel this order ?");
    if (!confirmed) return;

    dispatch(cancelOrder({orderId: order.id}));
  };

  const handleOrderAgain = (order) => {
    const confirmed = window.confirm("Are you sure you want to re-order this order again ?");
    if (!confirmed) return;

    dispatch(orderAgain({orderId: order.id}));
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Your Orders</h2>
      {orders.map((order) => (
        <div key={order.id} className="border rounded p-4 mb-4">
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Payment:</strong> {order.payment_method}</p>
          <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
          <ul className="mt-2">
            {order.items.map((item) => (
              <li key={item.product_id}>
                {item.name} - {item.quantity} × ${item.price}
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
