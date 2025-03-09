import { useNavigate } from "react-router-dom";
import "./home.css"

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="title">
      <h1>فذكر</h1>
      <h2>كانفاس ينبض بالايمان</h2>
      <button onClick={() => navigate("/login")}>Login</button> {/* ✅ Redirect to Login Page */}
    </div>
  );
};

export default Home;
