import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "../firebase";
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(); // Get Firebase token

          // Send token to backend for validation & secure cookie storage
          await axios.post("http://localhost:5000/auth/login", { token }, { withCredentials: true });

          setUser(firebaseUser); // Set user in state
        } catch (error) {
          console.error("Authentication error:", error);
        }
      } else {
        setUser(null);
        await axios.post("http://localhost:5000/auth/logout", {}, { withCredentials: true });
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    // Send token to backend for session management
    await axios.post("http://localhost:5000/auth", { token }, { withCredentials: true });

    return userCredential.user;
  };

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    // Send token to backend for session management
    await axios.post("http://localhost:5000/auth/login", { token }, { withCredentials: true });

    return userCredential.user;
  };

  const googleLogin = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const token = await userCredential.user.getIdToken();

    // Send token to backend for session management
    await axios.post("http://localhost:5000/auth/login", { token }, { withCredentials: true });

    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth); // Firebase sign out
    await axios.post("http://localhost:5000/auth/logout", {}, { withCredentials: true }); // Clear backend session
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
