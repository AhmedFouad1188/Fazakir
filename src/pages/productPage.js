import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { addToCart } from "../redux/cartSlice";
import axios from "axios";
import bgimg from '../assets/bgimg.png';
import { toast } from "react-toastify";
import styles from "../styles/productPage.module.css"; // You'll update this too
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/thumbs";
import "swiper/css/autoplay";
import SwiperCore from "swiper";

SwiperCore.use([Thumbs, Autoplay]);

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [dimension, setDimension] = useState("");
  const [material, setMaterial] = useState("");
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        const data = res.data;
  
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
      } catch (error) {
        console.error("Fetch error:", error);
        setError("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product?.category && product?.product_id) {
      const fetchRelatedProducts = async (category, excludeId) => {
        try {
          const res = await axios.get(
            `http://localhost:5000/api/products/${category}/${excludeId}`
          );
          setRelatedProducts(res.data);
        } catch (err) {
          console.error("Related fetch failed", err);
        }
      };
  
      fetchRelatedProducts(product.category, product.product_id);
    }
  }, [product]);  

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
    <div>
      <div className={styles.product}>
        <Swiper
          onSwiper={setThumbsSwiper}
          direction="vertical"
          spaceBetween={10}
          slidesPerView={Math.min(product.image_url.length, 10)}
          watchSlidesProgress
          className={styles.thumbSwiper}
        >
          {product.image_url.map((img, idx) => (
            <SwiperSlide key={idx}>
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className={styles.thumbnail}
              />
            </SwiperSlide>
          ))}
        </Swiper>
        
        {product.image_url.length > 0 && (
          <Swiper
            modules={[Thumbs, Autoplay]}
            autoplay={{ delay: 5000 }}
            loop={product.image_url.length > 1}
            thumbs={{ swiper: thumbsSwiper }}
            className={styles.mainSwiper}
          >
            {product.image_url.map((img, idx) => (
              <SwiperSlide key={idx}>
                <img
                  src={img}
                  alt={`${product.name} ${idx + 1}`}
                  className={styles.mainImage}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
  
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
          <button className={styles.button} onClick={() => handleAddToCart(product)}>أضف إلى السلة</button>
          <img src={bgimg} alt="Background" />
        </div>
      </div>

      <div className={styles.related}>
        <h2>منتجات ذات صلة</h2>
        <div className="prodcont">
                {relatedProducts.length > 0 ? (
                  relatedProducts.map((product) => {
                    return (
                      <div
                        key={product.product_id}
                        className="product"
                        onClick={() => navigate(`/product/${product.product_id}`)}
                      >
                        <img
                          src={product.image_url && product.image_url.startsWith("http") ? product.image_url : `http://localhost:5000${product.image_url || ""}`}
                          alt={product.name}
                        />
                        <div>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <p className="price">{product.price}</p>
                        <button onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}>أضف إلى السلة</button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p>No products found.</p>
                )}
              </div>
      </div>
    </div>
  );
};

export default ProductPage;
