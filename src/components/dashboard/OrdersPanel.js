import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { mapToArabic } from "../../utils/mapToArabic";

const OrdersPanel = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});
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

  const nextStatus = (current) => {
    switch (current) {
      case "new": return "preparing";
      case "preparing": return "out for delivery";
      case "out for delivery": return "delivered";
      default: return null;
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId] // Toggle the expanded state for this user
    }));
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="panelcont">
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <>
          <input
            type="text"
            placeholder="بحث فى الطلبات ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

            {orders
              .filter((o) =>
                `${o.id} ${o.firstname} ${o.lastname} ${o.email} ${o.dial_code}${o.mobile} ${o.status}`
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )
              .map((o) => {
                const isExpanded = expandedOrders[o.id] || false;

                return (
                  <div key={o.id} className="paneldet">
                    <div>
                      <p><span>رقم الطلب</span> {o.id}</p>
                      <p><span>طريقة الدفع</span> {o.payment_method}</p>
                      <p><span>الإجمالى</span> {o.total_price}</p>
                      <p><span>الاسم</span> {o.firstname} {o.lastname}</p>
                      <p><span>الدولة</span> {o.country}</p>
                      <p><span>رقم الجوال</span> {o.mobile} <p style={{ display: "inline", direction: "ltr" }}>{o.dial_code}</p></p>
                      <p><span>المحافظة</span> {o.governorate}</p>
                      <p><span>تم الطلب فى</span> {o.created_at}</p>
                      <p className="status" style={{ color: mapToArabic(o.status).color }}><span>حالة الطلب</span> {mapToArabic(o.status).text}</p>
    
                      <button 
                        onClick={() => toggleOrderExpansion(o.id)}
                        className="showmore"
                      >
                        {isExpanded ? (
                          <>
                            إخفاء التفاصيل
                            <FaChevronUp className="arrowIcon" />
                          </>
                        ) : (
                          <>
                            عرض المزيد
                            <FaChevronDown className="arrowIcon" />
                          </>
                        )}
                      </button>
                    </div>
  
                    {isExpanded && (
                      <div className="more">
                        <p><span>البريد الالكترونى</span> {o.email}</p>
                        <p><span>العنوان</span> {o.building} {o.street}, {o.district}, Floor: {o.floor}, Apt: {o.apartment}</p>
                        <p><span>علامة مميزة</span> {o.landmark}</p>
  
                        {o.items && o.items.length > 0 ? (
                          <>
                            <h3>محتوى الطلب</h3>
                            {o.items.map((item, index) => (
                              <div key={index} style={{ margin: "5vw auto"}}>
                                <p><img
                                      src={item.image_url && item.image_url.startsWith("http") ? item.image_url : `http://localhost:5000${item.image_url || ""}`}
                                      alt={item.name}
                                      style={{ width: "25vw", margin: "0 0 2vw 2vw" }}
                                      onClick={() => navigate(`/product/${item.product_id}`)}
                                    /> {item.name}</p>
                                <p><span>الكمية</span> {item.quantity}</p>
                                <p><span>سعر القطعة</span> {item.price}</p>
                              </div>
                            ))}
                          </>
                        ) : (
                          <p>No items found for this order.</p>
                        )};
  
                        {o.status !== "delivered" && o.status !== "cancelled" && (
                          <button
                            onClick={async () => {
                              const next = nextStatus(o.status);
                              if (!next) return
                              confirmAlert({
                                title: `تغيير حالة الطلب إلى ${next} ؟`,
                                message: `هل تريد تغيير حالة الطلب إلى ${next} ؟`,
                                buttons: [
                                  {
                                    label: 'نعم',
                                    onClick: async () => {
                                      try {
                                        await axios.put(`http://localhost:5000/api/orders/updateStatus/${o.id}`, { status: next }, { withCredentials: true });
                                        setOrders((prev) => prev.map((order) => order.id === o.id ? { ...order, status: next } : order
                                        )
                                        );
                                        toast.success(`Order marked as ${next}`);
                                      } catch {
                                        toast.error("Failed to update status");
                                      }
                                    }
                                  },
                                  {
                                    label: 'لا'
                                    // No action needed; this closes the dialog
                                  }
                                ]
                              });
                            }}
                          >
                            تغيير إلى <span>{mapToArabic(nextStatus(o.status)).text}</span>
                          </button>
                        )}
  
                        {o.status !== "cancelled" && o.status !== "delivered" && (
                          <button
                            onClick={async () => {
                              confirmAlert({
                                title: `إلغاء طلب رقم ${o.id} ؟`,
                                message: `هل تريد إلغاء طلب رقم ${o.id} ؟`,
                                buttons: [
                                  {
                                    label: 'نعم',
                                    onClick: async () => {
                                      try {
                                        await axios.put(`http://localhost:5000/api/orders/cancel/${o.id}`, {}, { withCredentials: true });
                                        setOrders((prev) => prev.map((order) => order.id === o.id ? { ...order, status: "cancelled" } : order
                                        )
                                        );
                                        toast.error("Order cancelled");
                                      } catch {
                                        toast.error("Failed to cancel order");
                                      }
                                    }
                                  },
                                  {
                                    label: 'لا'
                                    // No action needed; this closes the dialog
                                  }
                                ]
                              });
                            }}
                          >
                            إلغاء الطلب
                          </button>
                        )}
                      </div>
                    )}
                  </div>
              )})
            }
        </>
      )}
    </div>
)}

export default OrdersPanel;
