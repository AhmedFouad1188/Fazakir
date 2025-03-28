import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut
} from "firebase/auth";
import axios from "axios";
import { auth, googleProvider } from "../firebase";

const initialState = {
  user: null,
  isLoading: true,
  error: null,
};

export const signup = createAsyncThunk("auth/signup", async (formData, { rejectWithValue }) => {
  try {
    const { email, password, ...additionalData } = formData; // Extract email & password

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    const response = await axios.post("http://localhost:5000/auth/register", 
      { ...additionalData },  // ✅ Send all form data
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );

    return response.data.user;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const login = createAsyncThunk("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    const response = await axios.post("http://localhost:5000/auth/login", {}, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });

    return response.data.user;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const googleLogin = createAsyncThunk("auth/googleLogin", async (_, { rejectWithValue }) => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const token = await userCredential.user.getIdToken();

    const response = await axios.post("http://localhost:5000/auth/login", {}, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });

    return response.data.user;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const logout = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await signOut(auth);
    await axios.post("http://localhost:5000/auth/logout", {}, { withCredentials: true });
    return null;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const checkAuthState = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("http://localhost:5000/auth/me", {
        withCredentials: true,
      });
      return response.data.user; // Ensure backend returns user data, including `is_admin`
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to check authentication");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(signup.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(checkAuthState.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
        state.error = null; // ✅ Reset error on success
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.user = null;
        state.isLoading = false;
        state.error = action.payload; // ✅ Store meaningful error message
      });
  },
});

export default authSlice.reducer;
