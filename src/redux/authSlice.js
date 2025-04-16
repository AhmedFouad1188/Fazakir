import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  onIdTokenChanged
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

    const response = await axios.post("http://localhost:5000/api/auth/register", { ...additionalData },  // ✅ Send all form data
      { headers: { Authorization: `Bearer ${token}` },
        withCredentials: true }
    );

    return response.data.user;
  } catch (error) {
    return rejectWithValue({ code: error.code, message: error.message });
  }  
});

export const login = createAsyncThunk("auth/login", async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ❌ Reject login if email is not verified
      if (!user.emailVerified) {
        await signOut(auth); // ✅ Immediately sign out the user
        throw new Error("Your email is not verified. Please check your inbox or junk folder.");
      }

      const token = await user.getIdToken();

      const response = await axios.post("http://localhost:5000/api/auth/login", {}, 
        { headers: { Authorization: `Bearer ${token}` },
          withCredentials: true }
        );

      return response.data.user;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        code: error.code || "unknown_error",
      });
    }
  });

export const googleLogin = createAsyncThunk("auth/googleLogin", async (_, { rejectWithValue }) => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const token = await userCredential.user.getIdToken();

    const response = await axios.post("http://localhost:5000/api/auth/login", {}, 
      { headers: { Authorization: `Bearer ${token}` },
        withCredentials: true }
      );

    return response.data.user;
  } catch (error) {
    return rejectWithValue({ code: error.code, message: error.message });
  }
});

export const logout = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await signOut(auth);
    await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
    return null;
  } catch (error) {
    return rejectWithValue({ code: error.code, message: error.message });
  }
});

export const checkAuthState = createAsyncThunk("auth/checkAuth", async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/me", { withCredentials: true });
      return response.data.user; // Ensure backend returns user data, including `is_admin`
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to check authentication");
    }
  }
);

// Monitor Firebase token changes
onIdTokenChanged(auth, async (user) => {
  if (!user) {
    console.log("❌ No user logged in. Skipping token refresh.");
    return;
  }

  try {
    const newFirebaseToken = await user.getIdToken(); // Get new refreshed token

    // Send refreshed token to backend to update session cookie
    await axios.post("http://localhost:5000/api/auth/refresh-token", {}, {
      headers: { Authorization: `Bearer ${newFirebaseToken}` },
      withCredentials: true, // Ensures cookie is stored
    });
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
  }
});

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
