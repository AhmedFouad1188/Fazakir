import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch cart items from backend
export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { getState, rejectWithValue }) => {
  try {
    const user = getState().auth.user;
    if (!user?.token) return rejectWithValue("User not authenticated");

    const response = await axios.get("http://localhost:5000/cart", {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    return response.data; // Backend should return cart items
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to fetch cart");
  }
});

// Add item to cart
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ userId, productId, quantity }, { getState, rejectWithValue }) => {
    try {
      const user = getState().auth.user;
      if (!user?.token) return rejectWithValue("User not authenticated");

      const response = await axios.post(
        "http://localhost:5000/cart",
        { userId, productId, quantity },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      return response.data; // Return the updated cart item
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to add item");
    }
  }
);

// Remove item from cart
export const removeFromCart = createAsyncThunk("cart/removeFromCart", async (id, { getState, rejectWithValue }) => {
  try {
    const user = getState().auth.user;
    if (!user?.token) return rejectWithValue("User not authenticated");

    await axios.delete(`http://localhost:5000/cart/${id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    return id; // Return removed item ID to update Redux store
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to remove item");
  }
});

// Clear entire cart
export const clearCart = createAsyncThunk("cart/clearCart", async (_, { getState, rejectWithValue }) => {
  try {
    const user = getState().auth.user;
    if (!user?.token) return rejectWithValue("User not authenticated");

    await axios.delete("http://localhost:5000/cart/clear", {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    return []; // Return empty array to reset cart
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to clear cart");
  }
});

// Initial state
const initialState = {
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
  status: "idle",
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [], // Ensure items is always an array
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        
        // ✅ Calculate totalQuantity & totalPrice
        state.totalQuantity = action.payload.reduce((sum, item) => sum + item.quantity, 0);
        state.totalPrice = action.payload.reduce((sum, item) => sum + item.price * item.quantity, 0);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        const newItem = action.payload;
        
        // ✅ Check if item exists in cart
        const existingItem = state.items.find((item) => item.id === newItem.id);
        if (existingItem) {
          existingItem.quantity += newItem.quantity;
        } else {
          state.items.push(newItem);
        }

        // ✅ Update totalQuantity & totalPrice
        state.totalQuantity += newItem.quantity;
        state.totalPrice += newItem.price * newItem.quantity;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        const removedItem = state.items.find((item) => item.id === action.payload);
        if (removedItem) {
          // ✅ Deduct removed item quantity & price
          state.totalQuantity -= removedItem.quantity;
          state.totalPrice -= removedItem.price * removedItem.quantity;
        }

        // ✅ Filter out removed item
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.totalQuantity = 0;
        state.totalPrice = 0;
      });
  },
});

export default cartSlice.reducer;
