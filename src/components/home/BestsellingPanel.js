import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../../redux/cartSlice";
import axios from "axios";
import { toast } from "react-toastify";

const BestsellingPanel = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector((state) => state.auth.user); // ✅ Get logged-in user
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const fetchBestselling = async () => {
        setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/products/bestselling", { withCredentials: true });
        if (res.data.length === 0) {
            console.log("No products available.");
          }
        setProducts(res.data);
      } catch (error) {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
        fetchBestselling();
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
          await dispatch(addToCart(cartItem)).unwrap();
    
          toast.success(`${product.name} added to cart!`, {
            position: "top-right",
            autoClose: 2000,
          });
        } catch (error) {
          console.error("Add to Cart Error:", error.response || error.message);
          toast.error("Failed to add item to cart. Try again.");
        }
      };

    if (loading) return <p>Loading ...</p>;

    return (
        <div className="container">
              <h2>الأكــــثر مبيــــعاً</h2>
                
              <div className="prodcont">
                {products.length > 0 ? (
                  products.map((product) => {
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
    );
};

export default BestsellingPanel;