import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import authReducer from "./authSlice";

// Load cart from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem("cart");
    return serializedState ? JSON.parse(serializedState) : undefined;
  } catch (err) {
    return undefined;
  }
};

// Save cart to localStorage whenever it changes
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("cart", serializedState);
  } catch (err) {
    console.error("Failed to save state:", err);
  }
};

const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
  },
  preloadedState: {
    cart: loadState(),
  },
});

// Listen for changes and save to localStorage
store.subscribe(() => {
  saveState(store.getState().cart);
});

export default store;
