import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import cartReducer from "./cartSlice";
import orderReducer from "./orderSlice";

const store = configureStore({
  reducer: {
    auth: authReducer, // No persist, use normal reducer
    cart: cartReducer,
    order: orderReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Keep for safety, but no persist needed
    }),
});

export default store;
