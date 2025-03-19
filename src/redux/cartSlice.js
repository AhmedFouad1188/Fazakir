import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ✅ Base URL for the backend API
const API_URL = "http://localhost:5000/cart"; 

// ✅ Fetch cart from backend
export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { getState }) => {
  const token = getState().auth.token;
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error("Failed to fetch cart");
  return await response.json(); // Return cart data from backend
});

// ✅ Add item to cart in backend
export const addToCart = createAsyncThunk("cart/addToCart", async (item, { getState }) => {
  const token = getState().auth.token;
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error("Failed to add item to cart");
  return await response.json(); // Return updated cart item from backend
});

// ✅ Remove item from cart in backend
export const removeFromCart = createAsyncThunk("cart/removeFromCart", async (itemId, { getState }) => {
  const token = getState().auth.token;
  const response = await fetch(`${API_URL}/${itemId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to remove item from cart");
  return itemId; // Return deleted item ID
});

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [], // ✅ Cart items stored here
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ✅ Handle fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload; // ✅ Set cart items from backend
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      // ✅ Handle add to cart
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items.push(action.payload); // ✅ Update cart with new item
      })

      // ✅ Handle remove from cart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default cartSlice.reducer;
