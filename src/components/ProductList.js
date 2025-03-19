import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState({});
  const user = useSelector((state) => state.auth.user); // ✅ Get logged-in user
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/products");
        setProducts(response.data);

        const initialQuantities = response.data.reduce((acc, product) => {
          acc[product.id] = 1;
          return acc;
        }, {});
        setQuantities(initialQuantities);
      } catch (error) {
        console.error("Product Fetch Error:", error.response || error.message);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleIncrease = (id) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: prev[id] + 1,
    }));
  };

  const handleDecrease = (id) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: prev[id] > 1 ? prev[id] - 1 : 1,
    }));
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      toast.error("You must be logged in to add items to the cart.");
      return;
    }

    const cartItem = { ...product, quantity: quantities[product.id], userId: user.id };

    try {
      await axios.post("http://localhost:5000/cart", cartItem); // ✅ Sync with backend
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
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Product List</h2>

      {loading && <p>Loading products...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {products.length > 0 ? (
          products.map((product) => (
            <div
              key={product.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "10px",
                textAlign: "center",
              }}
            >
              <img
                src={product.image_url?.startsWith("http") ? product.image_url : `http://localhost:5000${product.image_url}`} // ✅ Fix Image URL
                alt={product.name}
                className="product-image"
                style={{ width: "15vw" }}
              />
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>${product.price}</strong>

              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "10px" }}>
                <button onClick={() => handleDecrease(product.id)} style={{ padding: "5px 10px", margin: "0 5px" }}>-</button>
                <span>{quantities[product.id]}</span>
                <button onClick={() => handleIncrease(product.id)} style={{ padding: "5px 10px", margin: "0 5px" }}>+</button>
              </div>

              <button
                onClick={() => handleAddToCart(product)}
                style={{
                  marginTop: "10px",
                  padding: "8px 15px",
                  background: "green",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Add to Cart
              </button>
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
