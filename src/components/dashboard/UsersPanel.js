import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const UsersPanel = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/fetchUsers", { withCredentials: true });
        setUsers(res.data);
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
        setOrders(res.data);
      } catch (err) {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();

  }, []);

  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId] // Toggle the expanded state for this user
    }));
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="panelcont">
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
      <>
        <input
          type="text"
          placeholder="بحث فى المستخدمين ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <div>
          {users
            .filter((u) =>
              `${u.firstname} ${u.lastname} ${u.email} ${u.dial_code}${u.mobile} ${u.isdeleted ? "حساب لاغى" : "نشط"}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
            .map((u) => {
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
        </div>
      </>
      )}
    </div>
  );
};

export default UsersPanel;