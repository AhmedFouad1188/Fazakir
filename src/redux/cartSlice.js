import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ✅ Load cart from database
export const loadCart = createAsyncThunk("cart/loadCart", async (userId) => {
  const response = await axios.get(`http://localhost/get_cart.php?user_id=${userId}`);
  return response.data;
});

// ✅ Save cart to database
export const saveCart = createAsyncThunk("cart/saveCart", async ({ userId, cart }) => {
  await axios.post("http://localhost/save_cart.php", { user_id: userId, cart });
});

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [], // ✅ Store cart items in an `items` array
  },
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find((item) => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push({
          ...action.payload,
          quantity: action.payload.quantity || 1, // ✅ Ensure quantity is at least 1
          price: action.payload.price || 0, // ✅ Ensure price is not undefined
        });
      }
    },
    removeFromCart: (state, action) => {
      const index = state.items.findIndex((item) => item.id === action.payload);
      if (index !== -1) {
        state.items.splice(index, 1); // ✅ Remove item from array
      }
    },    
  },
});

export const { addToCart, removeFromCart } = cartSlice.actions;
export default cartSlice.reducer;
