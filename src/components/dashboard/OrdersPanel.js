import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { FaSpinner, FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";
import { mapToArabic } from "../../utils/mapToArabic";

const OrdersPanel = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10); // You can adjust this number
  const [totalOrders, setTotalOrders] = useState(0);

  // Add debouncing for search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/orders/fetchAllOrders", { 
          withCredentials: true,
          params: {
            page: currentPage,
            limit: ordersPerPage,
            search: debouncedSearchTerm
          }
        });
        setOrders(res.data.orders);
        setTotalOrders(res.data.totalCount);
      } catch (err) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, ordersPerPage, debouncedSearchTerm]);

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

  // Calculate page numbers
  const pageNumbers = [];
  const totalPages = Math.ceil(totalOrders / ordersPerPage);
  
  // Show limited page numbers (e.g., 5 at a time)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);
  
  if (currentPage <= 3) {
    endPage = Math.min(5, totalPages);
  }
  if (currentPage >= totalPages - 2) {
    startPage = Math.max(1, totalPages - 4);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return (
      <div className="loading">
        <FaSpinner className="spinner" />
        <p>جارى تحميل الطلبات . . .</p>
      </div>
    );
  }

  return (
    <div className="panelcont">
      <div className="search">
        <input
          type="text"
          placeholder="بحث فى الطلبات . . ."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <FaTimes 
            className="clear"
            onClick={() => setSearchTerm('')}
          />
        )}
      </div>

      {orders.length === 0 ? (
        <p className="warn">لم نجد أى طلبات تتوافق مع كلمات البحث</p>
      ) : (
        <>
          {orders.map((o) => {
              const isExpanded = expandedOrders[o.id] || false;
              const next = nextStatus(o.status);
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
                      )}

                      <div style={{ display: "flex", marginTop: "10vw" }}>
                      {o.status !== "delivered" && o.status !== "cancelled" && (
                        <button
                          className="cold"
                          onClick={async () => {
                            if (!next) return
                            confirmAlert({
                              title: `تغيير حالة الطلب إلى ${mapToArabic(next).text} ؟`,
                              message: `هل تريد تغيير حالة الطلب إلى ${mapToArabic(next).text} ؟`,
                              buttons: [
                                {
                                  label: 'نعم',
                                  onClick: async () => {
                                    try {
                                      await axios.put(`http://localhost:5000/api/orders/updateStatus/${o.id}`, { status: next }, { withCredentials: true });
                                      setOrders((prev) => prev.map((order) => order.id === o.id ? { ...order, status: next } : order
                                      )
                                      );
                                      toast.success(`تم تغيير حالة الطلب إلى ${mapToArabic(next).text}`);
                                    } catch {
                                      toast.error("لم نتمكن من تغيير حالة الطلب. حاول مرة اخرى");
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
                          {mapToArabic(next).text}
                        </button>
                      )}

                      {o.status !== "cancelled" && o.status !== "delivered" && (
                        <button
                          className="danger buttonalign"
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
                                      toast.success("تم إلغاء الطلب بنجاح");
                                    } catch {
                                      toast.error("لم نتمكن من إلغاء الطلب. حاول مرة اخرى");
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
                          إلغاء
                        </button>
                      )}
                      </div>
                    </div>
                  )}
                </div>
              )
          })}

            {/* Enhanced Pagination */}
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
            >
              الأولى
            </button>
            
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
            >
              السابق
            </button>
            
            {startPage > 1 && <span>...</span>}
            
            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => setCurrentPage(number)}
                className={currentPage === number ? 'active' : ''}
              >
                {number}
              </button>
            ))}
            
            {endPage < totalPages && <span>...</span>}
            
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              التالي
            </button>
            
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              الأخيرة
            </button>
          </div>
        </>
      )}
    </div>
)}

export default OrdersPanel;
