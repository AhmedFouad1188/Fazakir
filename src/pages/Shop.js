import ProductList from "../components/ProductList";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import styles

const Shop = () => {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Shop</h1>
      <ToastContainer />
      <ProductList />
    </div>
  );
};

export default Shop;
