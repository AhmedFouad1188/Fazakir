import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Submit a new order
export const submitOrder = createAsyncThunk("orders/submitOrder", async (orderData, { rejectWithValue }) => {
  try {
    const response = await axios.post("http://localhost:5000/api/orders/add", orderData, { withCredentials: true });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Order failed");
  }
});

// Fetch all orders for the logged-in user
export const fetchOrders = createAsyncThunk("orders/fetchOrders", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get("http://localhost:5000/api/orders", { withCredentials: true });
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to fetch orders");
  }
});

export const updateOrderItem = createAsyncThunk("orders/updateOrderItem", async ({ orderId, productId, quantity }, { rejectWithValue }) => {
  try {
    const res = await axios.put(`http://localhost:5000/api/orders/${orderId}/update-item`, { productId, quantity }, { withCredentials: true });
    return { orderId, productId, quantity };
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to update item");
  }
});

export const deleteOrderItem = createAsyncThunk("orders/deleteOrderItem", async ({ orderId, productId }, { rejectWithValue }) => {
  try {
    await axios.delete(`http://localhost:5000/api/orders/${orderId}/delete-item/${productId}`, { withCredentials: true });
    return { orderId, productId };
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to delete item");
  }
});

// Cancel an order
export const cancelOrder = createAsyncThunk("orders/cancelOrder", async ({ orderId }, { rejectWithValue }) => {
  try {
    await axios.put(`http://localhost:5000/api/orders/${orderId}/cancel`, {}, { withCredentials: true });
    return orderId;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to cancel order");
  }
});

export const orderAgain = createAsyncThunk("orders/orderAgain", async ({ orderId }, { rejectWithValue }) => {
  try {
    await axios.put(`http://localhost:5000/api/orders/${orderId}/orderAgain`, {}, { withCredentials: true });
    return orderId;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to re-order an order");
  }
});

export const dashboardFetch = createAsyncThunk("orders/dashboardFetch", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get("http://localhost:5000/api/orders/dashboardFetch", { withCredentials: true });
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to fetch orders");
  }
});

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    loading: false,
    success: false,
    error: null,
    latestOrder: null,
    orders: [], // ✅ add this
  },  
  reducers: {
    resetOrderState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.latestOrder = null;
    },
  },  
  extraReducers: (builder) => {
    builder
      // Submit Order
      .addCase(submitOrder.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(submitOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.latestOrder = action.payload;
      })
      .addCase(submitOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.fetchStatus = "loading";
        state.fetchError = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.fetchError = action.payload;
      })

      .addCase(dashboardFetch.pending, (state) => {
        state.fetchStatus = "loading";
        state.fetchError = null;
      })
      .addCase(dashboardFetch.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.orders = action.payload;
      })
      .addCase(dashboardFetch.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.fetchError = action.payload;
      })

      .addCase(updateOrderItem.fulfilled, (state, action) => {
        const { orderId, productId, quantity } = action.payload;
        const order = state.orders.find((o) => o.order_id === orderId);
        if (order) {
          const item = order.items.find((i) => i.product_id === productId);
          if (item) item.quantity = quantity;
        }
      })

      .addCase(deleteOrderItem.fulfilled, (state, action) => {
        const { orderId, productId } = action.payload;
        const order = state.orders.find((o) => o.order_id === orderId);
        if (order) {
          order.items = order.items.filter((i) => i.product_id !== productId);
        }
      })

      .addCase(cancelOrder.fulfilled, (state, action) => {
        const order = state.orders.find((o) => o.id === action.payload);
        if (order) order.status = "cancelled";
      })

      .addCase(orderAgain.fulfilled, (state, action) => {
        const order = state.orders.find((o) => o.id === action.payload);
        if (order) order.status = "placed";
      })
  },
});

export const { resetOrderState } = orderSlice.actions;

export default orderSlice.reducer;
