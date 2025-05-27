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
    const confirmed = window.confirm("هل تريد حفظ التعديلات على الطلب ؟");
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
        <h3>تعديل طلب رقم {order.id}</h3>
        {items.map((item) => (
          <div key={item.product_id} className="itemcont">
            <img
              src={item.image_url && item.image_url.startsWith("http") ? item.image_url : `http://localhost:5000${item.image_url || ""}`}
              alt={item.name}
            />
            {item.name}
            <div className="quantity">
              <button
                onClick={() => handleDecrement(item.product_id)}
                className="cold dec"
              >−</button>
              <input
                type="number"
                value={quantities[item.product_id]}
                readOnly
              />
              <button
                onClick={() => handleIncrement(item.product_id)}
                className="cold inc"
              >+</button>
            </div>
            <button
              onClick={() => markItemForDeletion(item)}
              className="danger buttonalign"
            >
              حذف
            </button>
          </div>
        ))}

        {deletedItems.length > 0 && (
          <div>
            {deletedItems.length} item{deletedItems.length > 1 ? "s" : ""} will be deleted
          </div>
        )}

        <div className="actions">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="good"
          >
            {isSubmitting ? "جارى الحفظ ..." : "حفظ"}
          </button>
          <button onClick={onClose} className="danger buttonalign">
            خروج
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById("modal-root"));
};

export default EditOrderModal;
