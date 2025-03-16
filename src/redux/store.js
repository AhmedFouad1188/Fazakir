import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import userReducer from "./authSlice"; // ✅ Import userReducer

const store = configureStore({
  reducer: {
    cart: cartReducer,
    user: userReducer, // ✅ Add userReducer
  },
});

export default store;
