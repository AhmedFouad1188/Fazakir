import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaSpinner, FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";

const UsersPanel = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); // You can adjust this number
  const [totalUsers, setTotalUsers] = useState(0);

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
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/fetchUsers", { 
          withCredentials: true, 
          params: {
            page: currentPage,
            limit: usersPerPage,
            search: debouncedSearchTerm
          }
        });
        setUsers(res.data.users);
        setTotalUsers(res.data.totalCount);
      } catch (err) {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    const fetchUserOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/orders/fetchAllOrders", { withCredentials: true });
        setOrders(res.data.orders);
      } catch (err) {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();

  }, [currentPage, usersPerPage, debouncedSearchTerm]);

  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId] // Toggle the expanded state for this user
    }));
  };

  // Calculate page numbers
  const pageNumbers = [];
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  
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
        <p>جارى تحميل بيانات العملاء . . .</p>
      </div>
    );
  }

  return (
    <div className="panelcont">
      <div className="search">
        <input
          type="text"
          placeholder="بحث فى العملاء . . ."
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

      {users.length === 0 ? (
        <p className="warn">لم نجد أى عملاء تتوافق مع كلمات البحث</p>
      ) : (
      <>
        {users.map((u) => {
            const userOrderCount = orders.filter(order => order.firebase_uid === u.firebase_uid).length;
            const userOrderPlaced = orders.filter(order => order.firebase_uid === u.firebase_uid && order.status === "new").length;
            const userOrderDelivered = orders.filter(order => order.firebase_uid === u.firebase_uid && order.status === "delivered").length;
            const userOrderCancelled = orders.filter(order => order.firebase_uid === u.firebase_uid && order.status === "cancelled").length;
            const isExpanded = expandedUsers[u.firebase_uid] || false;
            return (
              <div key={u.firebase_uid} className="paneldet">
                <div>
                  <p><span>الاسم</span> {u.firstname} {u.lastname}</p>
                  <p><span>الدولة</span> {u.country}</p>
                  <p><span>رقم الجوال</span> {u.mobile} <p style={{ display: "inline", direction: "ltr" }}>{u.dial_code}</p></p>
                  <p><span>البريد الالكترونى</span> {u.email}</p>
                  <p style={{ color: u.isdeleted ? "red" : "green", fontWeight: "bold" }}><span>حالة الحساب</span> {u.isdeleted ? "تم الإلغاء" : "نشط"}</p>

                  <button 
                    onClick={() => toggleUserExpansion(u.firebase_uid)}
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
                    <p><span>إجمالى عدد الطلبات</span> {userOrderCount}</p>
                    <p><span>طلبات جديدة</span> {userOrderPlaced}</p>
                    <p><span>طلبات تم توصيلها</span> {userOrderDelivered}</p>
                    <p><span>طلبات تم إلغاؤها</span> {userOrderCancelled}</p>
                    <p><span>المحافظة</span> {u.governorate}</p>
                    <p><span>العنوان</span> {u.building} {u.street}, {u.district}, Floor: {u.floor}, Apt: {u.apartment}</p>
                    <p><span>علامة مميزة</span> {u.landmark}</p>
                    <p><span>تم التسجيل فى</span> {u.created_at}</p>
                    <p><span>تم إلغاء الحساب فى</span> {u.deleted_at}</p>
                  </div>
                )}
              </div>
            )
          })
        }

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
  );
};

export default UsersPanel;
