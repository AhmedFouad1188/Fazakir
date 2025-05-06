import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { updateOrderItem, deleteOrderItem, fetchOrders } from "../redux/orderSlice";
import { toast } from "react-toastify";

const EditOrderModal = ({ order, onClose }) => {
  const dispatch = useDispatch();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [deletedItems, setDeletedItems] = useState([]);

  useEffect(() => {
    if (order?.items) {
      setItems(order.items);
      const initialQuantities = order.items.reduce((acc, item) => {
        acc[item.product_id] = item.quantity;
        return acc;
      }, {});
      setQuantities(initialQuantities);
    }
  }, [order]);

  if (!order || !items.length) return null;

  const handleIncrement = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: prev[productId] + 1,
    }));
  };

  const handleDecrement = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, prev[productId] - 1), // minimum 1
    }));
  };

  const markItemForDeletion = (item) => {
    setDeletedItems((prev) => [...prev, item]);
    setItems((prev) => prev.filter((i) => i.product_id !== item.product_id));
    const newQuantities = { ...quantities };
    delete newQuantities[item.product_id];
    setQuantities(newQuantities);
  };

  const handleSave = async () => {
    const confirmed = window.confirm("Are you sure you want to save changes?");
    if (!confirmed) return;

    setIsSubmitting(true);
    let hasChanges = false;

    for (const item of items) {
      const newQuantity = quantities[item.product_id];
      if (newQuantity !== item.quantity) {
        await dispatch(updateOrderItem({
          orderId: item.order_id,
          productId: item.product_id,
          quantity: newQuantity
        }));
        hasChanges = true;
      }
    }

    for (const item of deletedItems) {
      await dispatch(deleteOrderItem({
        orderId: item.order_id,
        productId: item.product_id
      }));
      hasChanges = true;
    }

    if (hasChanges) {
      await dispatch(fetchOrders());
    }

    toast.success("Order updated successfully");

    setIsSubmitting(false);
    onClose();
  };

  const modalContent = (
    <div className="custom-modal-overlay">
      <div className="custom-modal">
        <h2>Edit Order #{order.id}</h2>
        {items.map((item) => (
          <div key={item.product_id} className="mb-4 flex items-center justify-between">
            <img
              src={item.image_url && item.image_url.startsWith("http") ? item.image_url : `http://localhost:5000${item.image_url || ""}`}
              alt={item.name}
              style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "5px", marginRight: "15px" }}
            />
            <div className="flex-1">{item.name}</div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDecrement(item.product_id)}
                className="px-2 py-1 border rounded"
              >−</button>
              <input
                type="number"
                value={quantities[item.product_id]}
                readOnly
                className="w-12 text-center border rounded"
              />
              <button
                onClick={() => handleIncrement(item.product_id)}
                className="px-2 py-1 border rounded"
              >+</button>
            </div>
            <button
              onClick={() => markItemForDeletion(item)}
              className="ml-3 text-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        ))}

        {deletedItems.length > 0 && (
          <div className="text-sm text-red-500 mb-2">
            {deletedItems.length} item{deletedItems.length > 1 ? "s" : ""} will be deleted
          </div>
        )}

        <div className="actions">
          <button onClick={onClose}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById("modal-root"));
};

export default EditOrderModal;
