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

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await dispatch(googleLogin ()).unwrap();
      navigate("/");
    } catch (err) {
      setError("Google login failed. Please try again.");
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
