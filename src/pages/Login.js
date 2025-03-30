import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, googleLogin } from "../redux/authSlice";
import "./login.css";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await dispatch(login({ email, password })).unwrap();

      navigate("/");

    } catch (error) {
      console.error("Login Error:", error); // Log for debugging

    let errorMessage = error?.message || "Login failed. Please try again.";
    
    if (error?.code === "auth/invalid-credential") {
      errorMessage = "Incorrect Email or Password.";
    } else if (error?.code === "auth/user-not-found") {
      errorMessage = "No account found with this email. Please Sign Up.";
    } else if (error?.code === "auth/wrong-password") {
      errorMessage = "Incorrect password.";
    } else if (error?.message.includes("not verified")) {
      errorMessage = "Your email is not verified. Please click on the verification link in your inbox or junk folder.";
    }

    setError(errorMessage);
  }
};

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await dispatch(googleLogin ()).unwrap();
      navigate("/");
    } catch (error) {
      console.error("Google Login Error:", error); // Log full error for debugging
  
      let errorMessage = "Google login failed. Please try again.";
  
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.code === "auth/popup-closed-by-user") {
        errorMessage = "Google sign-in was closed before completing. Please try again.";
      } else if (error?.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error?.message) {
        errorMessage = error.message; // Default error message from Firebase
      }
  
      setError(errorMessage);
    }
  };

  return (
    <div className="login">
      <h2>تسجيل الدخول</h2>
      <form className="loginform" onSubmit={handleLogin}>
        <div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <label> : الايميل</label>
        </div>
        <div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          <label> : كلمة السر</label>
        </div>
        <button type="submit">تسجيل الدخول</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <p>هل نسيت كلمة السر ؟ <Link to="/forgot-password">إضغط هنا</Link></p>
      <p>لا يوجد حساب لديك ؟ <Link to="/signup">أنشىء حساب هنا</Link></p>
      <hr />
      <button className="googlelogin" onClick={handleGoogleLogin}>
        <FcGoogle size={27} style={{ marginRight: "0.8vw" }} /> سجل الدخول بواسطة جوجل
      </button>
    </div>
  );
};

export default Login;
