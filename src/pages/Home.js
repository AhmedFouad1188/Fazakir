import ProductList from "../components/ProductList";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import styles
import "./home.css"

const Home = () => {

  return (
    <div>
      <h1>فذكر</h1>
      <h2>كانفاس ينبض بالايمان</h2>
      <ToastContainer />
      <ProductList />
    </div>
  );
};

export default Home;
