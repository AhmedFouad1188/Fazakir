import { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { auth, googleProvider } from "../firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { loginSuccess, logout } from "../redux/authSlice";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        
        // ✅ Only update Redux if user isn't already stored
        if (!user) {
          dispatch(loginSuccess({ user: { email: firebaseUser.email, uid: firebaseUser.uid }, token }));
        }
      } else {
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch, user]);

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const googleLogin = async () => {
    return await signInWithPopup(auth, googleProvider);
  };

  const logoutUser = async () => {
    await signOut(auth);
    dispatch(logout());
  };

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, logout: logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
