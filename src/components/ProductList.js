import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import toast styles

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState({});

  const dispatch = useDispatch();

  useEffect(() => {
    axios
      .get("http://localhost:5000/products")
      .then((response) => {
        setProducts(response.data);
        const initialQuantities = response.data.reduce((acc, product) => {
          acc[product.id] = 1;
          return acc;
        }, {});
        setQuantities(initialQuantities);
      })
      .catch(() => {
        setError("Failed to load products.");
      })
      .finally(() => {
        setLoading(false);
      });
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

  const handleAddToCart = (product) => {
    dispatch(addToCart({ ...product, quantity: quantities[product.id] }));
    
    // ✅ Show toast notification
    toast.success(`${product.name} added to cart!`, {
      position: "top-right",
      autoClose: 2000, // Toast disappears after 2 seconds
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
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
                src={`http://localhost:5000${product.image_url}`}
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
