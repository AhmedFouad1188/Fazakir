import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const UsersPanel = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);

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

  const toggleUser = (userId) => {
    setExpandedUserId((prevId) => (prevId === userId ? null : userId));
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div>
      <h2>Users</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
      <>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: "10px", padding: "5px", width: "300px" }}
        />
        <table border="1">
          <thead>
            <tr>
              <th>Name</th>
              <th>Country</th>
              <th>Mobile</th>
              <th>Created at</th>
              <th>Status</th>
              <th>Deleted at</th>
              <th>Total orders</th>
              <th>Placed</th>
              <th>Delivered</th>
              <th>Cancelled</th>
            </tr>
          </thead>
          <tbody>
          {users
            .filter((u) =>
              `${u.firstname} ${u.lastname} ${u.email} ${u.dial_code}${u.mobile} ${u.isdeleted ? "Deleted" : "Active"}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
            .map((u) => {
              const userOrderCount = orders.filter(order => order.firebase_uid === u.firebase_uid).length;
              const userOrderPlaced = orders.filter(order => order.firebase_uid === u.firebase_uid && order.status === "placed").length;
              const userOrderDelivered = orders.filter(order => order.firebase_uid === u.firebase_uid && order.status === "delivered").length;
              const userOrderCancelled = orders.filter(order => order.firebase_uid === u.firebase_uid && order.status === "cancelled").length;
          
              return (
                <React.Fragment key={u.firebase_uid}>
                  <tr 
                    onClick={() => toggleUser(u.firebase_uid)}
                    style={{ cursor: "pointer", backgroundColor: expandedUserId === u.firebase_uid ? "#f9f9f9" : "white" }}
                  >
                    <td>{u.firstname} {u.lastname}</td>
                    <td>{u.country}</td>
                    <td>{u.dial_code} {u.mobile}</td>
                    <td>{u.created_at}</td>
                    <td style={{ color: u.isdeleted ? "red" : "green" }}>
                      {u.isdeleted ? "Deleted" : "Active"}
                    </td>
                    <td>{u.deleted_at}</td>
                    <td>{userOrderCount}</td>
                    <td>{userOrderPlaced}</td>
                    <td>{userOrderDelivered}</td>
                    <td>{userOrderCancelled}</td>
                  </tr>
          
                  {expandedUserId === u.firebase_uid && (
                    <tr>
                      <td colSpan="10">
                        <table border="1" style={{ width: "100%", marginTop: "10px" }}>
                          <thead>
                            <tr>
                              <th>Email</th>
                              <th>Governorate</th>
                              <th>Address</th>
                              <th>Landmark</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{u.email}</td>
                              <td>{u.governorate}</td>
                              <td>{u.building} {u.street}, {u.district}, Floor: {u.floor}, Apt: {u.apartment}</td>
                              <td>{u.landmark}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </>
      )}
    </div>
  );
};

export default UsersPanel;