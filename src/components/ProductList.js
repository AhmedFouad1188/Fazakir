import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../styles/productlist.module.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useSelector((state) => state.auth.user); // ✅ Get logged-in user
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products");
        setProducts(response.data);

      } catch (error) {
        console.error("Product Fetch Error:", error.response || error.message);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    if (!user) {
      toast.error("You must be logged in to add items to the cart.");
      return;
    }

    const cartItem = { 
      productId: product.product_id, 
    };
    
    try {
      dispatch(addToCart(cartItem)); // ✅ Update Redux store

      toast.success(`${product.name} added to cart!`, {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Add to Cart Error:", error.response || error.message);
      toast.error("Failed to add item to cart. Try again.");
    }
  };

  return (
    <div className={styles.container}>
      <h2>الأكــــثر مبيــــعاً</h2>

      {loading && <p>Loading products...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className={styles.prodcont}>
        {products.length > 0 ? (
          products.map((product) => (
            <div
              key={product.product_id}
              className={styles.product}
            >
              <img
                src={product.image_url?.startsWith("http") ? product.image_url : `http://localhost:5000${product.image_url}`} // ✅ Fix Image URL
                alt={product.name}
              />
              <div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p className="price">${product.price}</p>
              <button onClick={() => handleAddToCart(product)}>أضف إلى السلة</button>
              </div>
            </div>
          ))
        ) : (
          <p>No products found.</p>
        )}
      </div>
    </div>
  );
};

export default ProductList;
