import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, cancelOrder, orderAgain } from "../redux/orderSlice";
import EditOrderModal from "../components/editOrderModal";
import { toast } from "react-toastify";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { mapToArabic } from "../utils/mapToArabic";

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
        title: 'إلغاء الطلب ؟',
        message: `هل تريد إلغاء طلب رقم ${order.id} ؟`,
        buttons: [
          {
            label: 'نعم',
            onClick: async () => {
              try {
                await dispatch(cancelOrder({orderId: order.id})).unwrap();
                toast.success(`تم إلغاء الطلب بنجاح`, {
                  position: "top-right",
                  autoClose: 2000,
                });
              } catch (error) {
                toast.error("لم نتمكن من إلغاء الطلب. حاول مرة اخرى", {
                  position: "top-right",
                  autoClose: 2000,
                });
              }
            }
          },
          {
            label: 'لا'
            // No action needed; this closes the dialog
          }
        ]
      });
  };

  const handleOrderAgain = (order) => {
    confirmAlert({
      title: 'طلب مرة اخرى ؟',
      message: `هل تريد أن تطلب هذا الطلب مرة اخرى ؟`,
      buttons: [
        {
          label: 'نعم',
          onClick: async () => {
            try {
              await dispatch(orderAgain({orderId: order.id})).unwrap();
              toast.success(`تم إنشاء الطلب بنجاح`, {
                position: "top-right",
                autoClose: 2000,
              });
              dispatch(fetchOrders());
            } catch (error) {
              toast.error("لم نتمكن من إنشاء الطلب. حاول مرة اخرى", {
                position: "top-right",
                autoClose: 2000,
              });
            }
          }
        },
        {
          label: 'لا'
          // No action needed; this closes the dialog
        }
      ]
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>طلبـــــاتــك</h2>
      {orders.map((order) => (
        <div key={order.id} className="paneldet">
          <p><span>رقم الطلب</span> {order.id}</p>
          <p className="status" style={{ color: mapToArabic(order.status).color }}><span>حالة الطلب</span> {mapToArabic(order.status).text}</p>
          <p><span>وقت الطلب</span> {new Date(order.created_at).toLocaleString()}</p>
          <p><span>إجمالى</span> {order.total_price}</p>
          <p><span>طريقة الدفع</span> {order.payment_method}</p>
          <div style={{ marginTop: "5vw" }}>
            {order.items.map((item) => (
              <div key={item.product_id} style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "center", margin: "3vw 0" }}>
                <img
                  src={item.image_url && item.image_url.startsWith("http") ? item.image_url : `http://localhost:5000${item.image_url || ""}`}
                  alt={item.name}
                  onClick={() => navigate(`/product/${item.product_id}`)}
                  style={{ width: "25vw", marginLeft: "2vw" }}
                />
                {item.name} - {item.quantity} × {item.price}
              </div>
            ))}
          </div>

          <div style={{ marginTop: "10vw", display: "flex", justifyContent: "center" }}>
            {order.payment_method === "Cash on Delivery" && order.status === "new" && (
              <>
                <button
                  onClick={() => handleEditClick(order)}
                  className="cold"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleCancel(order)}
                  className="danger buttonalign"
                >
                  إلغاء
                </button>
              </>
            )}
  
            {order.payment_method === "Cash on Delivery" && order.status === "preparing" && (
              <>
                <button
                  onClick={() => handleCancel(order)}
                  className="danger"
                >
                  إلغاء الطلب
                </button>
              </>
            )}
  
            {order.payment_method === "Cash on Delivery" && order.status === "cancelled" && (
              <>
                <button 
                  onClick={() => handleOrderAgain(order)}
                  className="good"
                >
                  اطلب مرة اخرى
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      {selectedOrder && (
        <EditOrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default Orders;
