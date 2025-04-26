import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../styles/products.module.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("");
  const [dimension, setDimension] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [material, setMaterial] = useState("");
  const [sortOrder, setSortOrder] = useState("");
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

  const resetFilters = () => {
    setCategory("");
    setDimension("");
    setColor("");
    setPrice("");
    setMaterial("");
    setSortOrder("");
  };

  const filteredAndSortedProducts = products
    .filter((p) =>
      (category === "" || p.category === category) &&
      (dimension === "" || p.dimension === dimension) &&
      (color === "" || p.color === color) &&
      (material === "" || p.material === material)
    )
    .sort((a, b) => {
      if (sortOrder === "asc") return a.price - b.price;
      if (sortOrder === "desc") return b.price - a.price;
      return 0;
    });

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
    <div>
        <p className={styles.filtertitle}>العرض حسب :</p>
        <div className={styles.filter}>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">الفئة</option>
                <option value="Quran">آيات قرآنية</option>
                <option value="Modern">مودرن</option>
                <option value="Kids">اطفال</option>
            </select>
            <select value={dimension} onChange={(e) => setDimension(e.target.value)}>
                <option value="">المقاس</option>
                <option>مقاس1</option>
                <option>مقاس2</option>
                <option>مقاس3</option>
                <option>مقاس4</option>
                <option>مقاس5</option>
                <option>مقاس6</option>
            </select>
            <select value={color} onChange={(e) => setColor(e.target.value)}>
                <option value="">الالوان</option>
                <option>فاتحة</option>
                <option>غامقة</option>
            </select>
            <select value={price} onChange={(e) => setPrice(e.target.value)}>
                <option value="">السعر</option>
            </select>
            <select value={material} onChange={(e) => setMaterial(e.target.value)}>
                <option value="">الخامة</option>
                <option>مط</option>
                <option>لامع</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="">ترتيب بالسعر</option>
              <option value="asc">من الأرخص إلى الأغلى</option>
              <option value="desc">من الأغلى إلى الأرخص</option>
            </select>
            <button onClick={resetFilters}>- إلغاء الفلتر</button>
        </div>

      {loading && <p>Loading products...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className={styles.prodcont}>
        {filteredAndSortedProducts.length > 0 ? (
            filteredAndSortedProducts.map((product) => (
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

export default Products;
