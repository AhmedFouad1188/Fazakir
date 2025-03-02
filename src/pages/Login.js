import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase"; // ✅ Import Firebase auth & Google provider

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in:", userCredential.user);
      navigate("/shop"); // Redirect to shop page
    } catch (error) {
      setError(error.message);
      console.error("Login error:", error.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError(""); // Clear previous errors

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Google Sign-in:", user);
      navigate("/shop"); // Redirect to shop page
    } catch (error) {
      setError(error.message);
      console.error("Google login failed:", error.message);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Login</h2>

      {error && <p style={{ color: "red" }}>{error}</p>} {/* Display error message */}

      <form onSubmit={handleLogin} style={{ marginBottom: "20px" }}>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Login</button>
      </form>

      <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>

      <hr style={{ margin: "20px 0" }} />

      {/* Google Login Button */}
      <button 
        onClick={handleGoogleLogin} 
        style={{ background: "#4285F4", color: "#fff", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer" }}
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
