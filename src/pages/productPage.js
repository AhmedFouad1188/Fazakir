import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { addToCart } from "../redux/cartSlice";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../styles/productPage.module.css"; // You'll update this too

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [dimension, setDimension] = useState("");
  const [material, setMaterial] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        const data = res.data[0];
  
        if (!data) {
          setError("Product not found.");
          return;
        }
  
        // Ensure image_url is an array and convert paths to full URLs
        data.image_url = Array.isArray(data.image_url)
          ? data.image_url.map((img) =>
              img.startsWith("http") ? img : `http://localhost:5000${img}`
            )
          : [];
  
        setProduct(data);
        setSelectedImage(data.image_url[0] || "");
      } catch (error) {
        console.error("Fetch error:", error);
        setError("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchProduct();
  }, [id]);  

  const handleAddToCart = (product) => {
    if (!user) {
      toast.error("You must be logged in to add items to the cart.");
      return;
    }

    const cartItem = { productId: product.product_id };
    try {
      dispatch(addToCart(cartItem));
      toast.success(`${product.name} added to cart!`, {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      toast.error("Failed to add item to cart.");
    }
  };

  if (loading) return <p>Loading product...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.imageSection}>
        {selectedImage && (
          <img className={styles.mainImage} src={selectedImage} alt={product.name} />
        )}
        <div className={styles.thumbnailContainer}>
          {product.image_url.map((img, idx) => (
            <img
              key={idx}
              src={img}
              className={`${styles.thumbnail} ${
                selectedImage === img ? styles.active : ""
              }`}
              onClick={() => setSelectedImage(img)}
              alt={`Thumbnail ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.details}>
        <h2>{product.name}</h2>
        <p>{product.description}</p>

        <select value={dimension} onChange={(e) => setDimension(e.target.value)}>
          <option value="">المقاس</option>
          <option>مقاس1</option>
          <option>مقاس2</option>
          <option>مقاس3</option>
          <option>مقاس4</option>
          <option>مقاس5</option>
          <option>مقاس6</option>
        </select>

        <select value={material} onChange={(e) => setMaterial(e.target.value)}>
          <option value="">الخامة</option>
          <option>مط</option>
          <option>لامع</option>
        </select>

        <p>السعر: {product.price}</p>
        <button onClick={() => handleAddToCart(product)}>أضف إلى السلة</button>
      </div>
    </div>
  );
};

export default ProductPage;
