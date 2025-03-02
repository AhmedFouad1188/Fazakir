import { useState, useEffect } from "react";
import ProductList from "../components/ProductList";

const Shop = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("https://fakestoreapi.com/products") // Fetch from FakeStoreAPI
      .then((res) => res.json())
      .then((data) => setProducts(data)) // Store in state
      .catch((error) => console.error("Error fetching products:", error));
  }, []);

  return (
    <div>
      <h1>Shop</h1>
      <ProductList products={products} />
    </div>
  );
};

export default Shop;
