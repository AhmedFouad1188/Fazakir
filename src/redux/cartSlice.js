import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch cart items from backend
export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { getState }) => {
  const user = getState().auth.user; // Get logged-in user
  if (!user?.token) throw new Error("User not authenticated");

  const response = await axios.get("http://localhost:5000/cart", {
    headers: { Authorization: `Bearer ${user.token}` },
  });
  return response.data; // Backend should return cart items
});

// ✅ Async action to add item to cart in backend
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ userId, productId, quantity }, { getState, rejectWithValue }) => {
    try {
      const user = getState().auth.user;
      if (!user) return rejectWithValue("User not authenticated");

      const response = await axios.post(
        "http://localhost:5000/cart",
        { userId, productId, quantity },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      return response.data; // ✅ Return the full cart item from backend
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Remove item from cart
export const removeFromCart = createAsyncThunk("cart/removeFromCart", async (id, { getState, rejectWithValue }) => {
  try {
    const user = getState().auth.user;
    if (!user) return rejectWithValue("User not authenticated");

    await axios.delete(`http://localhost:5000/cart/${id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    return id; // Return removed item ID to update Redux store
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to remove item");
  }
});

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items.push(action.payload); // ✅ Add full item from backend
      })      
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
      })
  },
});

export default cartSlice.reducer;
