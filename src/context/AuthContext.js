import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "../firebase";
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import axios from "axios";

// Create Auth Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🔹 Monitor Authentication State
  useEffect(() => {
    let lastUserUID = null; // Track last user UID to prevent duplicate API calls
  
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser); // ✅ Update user state only once
  
        // 🔄 Prevent unnecessary API requests if the same user is already logged in
        if (firebaseUser.uid !== lastUserUID) {
          lastUserUID = firebaseUser.uid;
  
          try {
            const token = await firebaseUser.getIdToken(); // ✅ Get Firebase token
            
            // ✅ Send token to backend for validation & secure cookie storage
            await axios.post("http://localhost:5000/auth/login", {}, {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            });
  
          } catch (error) {
            console.error("🔥 Authentication error:", error);
          }
        }
      } else {
        console.log("🚪 User signed out");
        setUser(null);
        lastUserUID = null;
      }
    });
  
    return () => {
      console.log("🔄 Unsubscribing auth listener");
      unsubscribe();
    };
  }, []);  

  // 🔹 Signup with Email & Password
  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // ✅ Send verification email
      await sendEmailVerification(userCredential.user);
  
      return userCredential;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // 🔹 Login with Email & Password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
  
      // ✅ Send token to backend for session management
      await axios.post("http://localhost:5000/auth/login", {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
  
      return userCredential;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };  

  // 🔹 Google Login
  const googleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const token = await userCredential.user.getIdToken();
  
      await axios.post(
        "http://localhost:5000/auth/login", {}, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
  
      return userCredential;
    } catch (error) {
      console.error("🔥 Google login error:", error);
      throw error;
    }
  };

  // 🔹 Logout
  const logout = async () => {
    try {
      await signOut(auth); // ✅ Firebase sign out
      await axios.post("http://localhost:5000/auth/logout", {}, { withCredentials: true }); // ✅ Clear backend session
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔹 Custom Hook for Using Auth
export const useAuth = () => useContext(AuthContext);
