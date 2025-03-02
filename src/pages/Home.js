import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Welcome to Our Store</h1>
      <button onClick={() => navigate("/login")}>Login</button> {/* ✅ Redirect to Login Page */}
    </div>
  );
};

export default Home;
