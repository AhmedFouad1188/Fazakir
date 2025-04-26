import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch cart items from backend
export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("http://localhost:5000/api/cart", { withCredentials: true });

    return response.data; // Backend should return cart items
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to fetch cart");
  }
});

// Add item to cart
export const addToCart = createAsyncThunk("cart/addToCart", async ({ productId }, { rejectWithValue }) => {
  try {
      const response = await axios.post("http://localhost:5000/api/cart/add", { productId }, { withCredentials: true });

      return response.data; // Return the updated cart item
  } catch (error) {
      console.error("Error occurred in API call:", error);
      return rejectWithValue(error.response?.data || "Failed to add item");
    }
});

// Remove item from cart
export const removeFromCart = createAsyncThunk("cart/removeFromCart", async (product_id, { rejectWithValue }) => {
  try {
    await axios.delete(`http://localhost:5000/api/cart/${product_id}`, { withCredentials: true });

    return product_id; // Return removed item ID to update Redux store
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to remove item");
  }
});

export const updateCartQuantity = createAsyncThunk("cart/updateCartQuantity", async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    const response = await axios.put("http://localhost:5000/api/cart/update", { productId, quantity }, { withCredentials: true });

    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to update quantity");
  }
});

// Clear entire cart
export const clearCart = createAsyncThunk("cart/clearCart", async (_, { rejectWithValue }) => {
  try {
    await axios.delete("http://localhost:5000/api/cart/clear", { withCredentials: true });

    return []; // Return empty array to reset cart
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to clear cart");
  }
});

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
        state.error = null;
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
        const existingItem = state.items.find(item => item.product_id === newItem.product_id);
        if (existingItem) {
          existingItem.quantity = Number(newItem.quantity); // Overwrite quantity from DB
        } else {
          state.items.push(newItem);
        }

        // ✅ Always recalculate totals to avoid duplicates or over-counting
        state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      })

      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload || "Failed to add item";
      })

      .addCase(removeFromCart.fulfilled, (state, action) => {
        const removedItem = state.items.find((item) => item.product_id === action.payload);
        if (removedItem) {
          // ✅ Deduct removed item quantity & price
          state.totalQuantity -= removedItem.quantity;
          state.totalPrice -= removedItem.price * removedItem.quantity;
        }

        // ✅ Filter out removed item
        state.items = state.items.filter((item) => item.product_id !== action.payload);
      })

      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload || "Failed to remove item";
      })

      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.totalQuantity = 0;
        state.totalPrice = 0;
      })

      .addCase(clearCart.rejected, (state, action) => {
        state.error = action.payload || "Failed to clear cart";
      })

      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        const productId = action.payload.product_id || action.payload.productId;
const newQuantity = Number(action.payload.quantity);
const existingItem = state.items.find(item => item.product_id === productId);

if (existingItem) {
  existingItem.quantity = newQuantity;
}

        
          // 🔁 Recalculate totals
          state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
          state.totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        })

      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.error = action.payload || "Failed to update item quantity";
      })
  },
});

export default cartSlice.reducer;
