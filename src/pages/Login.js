import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ✅ Use AuthContext
import "./login.css";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, googleLogin, loading } = useAuth(); // ✅ Get auth functions & loading state
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const userCredential = await login(email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Your email is not verified. Please check your inbox.");
        return;
      }

      console.log("✅ User signed in:", user);
      navigate("/"); // ✅ Redirect to homepage
    } catch (error) {
      console.error("🔥 Firebase Error:", error.code);

      // ✅ Custom error messages
      let errorMessage = "An unknown error occurred. Please try again.";

      switch (error.code) {
        case "auth/invalid-credential":
          errorMessage = "Incorrect Email or Password.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        default:
          errorMessage = "Something went wrong. Please try again later.";
      }

      setError(errorMessage);
    }
  };

  const handleGoogleLogin = useCallback(async () => {
    if (loading) return; // ✅ Prevent multiple calls
    setError(""); // Clear previous errors
  
    try {
      const userCredential = await googleLogin();
      console.log("✅ Google Sign-in:", userCredential.user);
  
      navigate("/"); // ✅ Navigate only after success
    } catch (error) {
      setError("Google login failed. Please try again.");
      console.error("🔥 Google login failed:", error.message);
    }
  }, [googleLogin, loading]); // ✅ Added dependencies

  return (
    <div className="login">
      <h2>تسجيل الدخول</h2>

      <form className="loginform" onSubmit={handleLogin}>
        <div>
          <input 
            type="email" 
            name="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            autoComplete="email"
            disabled={loading} 
          />
          <label> : الايميل</label>
        </div>
        <div>
          <input 
            type="password" 
            id="loginpass" 
            name="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            autoComplete="current-password"
            disabled={loading} 
          />
          <label> : كلمة السر</label>
        </div>
        <button type="submit" id="loginsubmit" disabled={loading}>
          {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>} {/* Display error message */}

      <p>هل نسيت كلمة السر ؟ <Link to="/forgot-password">إضغط هنا</Link></p>
      <p>لا يوجد حساب لديك ؟ <Link to="/signup">أنشىء حساب هنا</Link></p>

      <hr/>

      {/* Google Login Button */}
      <button className="googlelogin" onClick={handleGoogleLogin} disabled={loading}>
        <FcGoogle size={27} style={{ marginRight: "0.8vw" }} />
        {loading ? "جاري تسجيل الدخول..." : "سجل الدخول بواسطة جوجل"}
      </button>
    </div>
  );
};

export default Login;
