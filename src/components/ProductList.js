import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/products") // Backend API endpoint
      .then((response) => {
        console.log("Fetched products:", response.data); // Debugging
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setError("Failed to load products.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Product List</h2>

      {loading && <p>Loading products...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginTop: "20px" }}>
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
              <img
                src={`http://localhost:5000${product.image_url}`} // 👈 Fix image URL
                alt={product.name}
                className="product-image"
                style={{width: "15vw"}}
              />
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>${product.price}</strong>
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
