import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null, // Stores user info (null when logged out)
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload; // Store user data after login
    },
    logout: (state) => {
      state.user = null; // Clear user data on logout
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
