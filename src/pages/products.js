import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../redux/cartSlice";
import { Offcanvas, Button } from 'react-bootstrap';
import axios from "axios";
import { FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import styles from "../styles/products.module.css";

const Products = () => {
  const [show, setShow] = useState(false);
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20); // You can adjust this number
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products", {
          params: {
            page: currentPage,
            limit: productsPerPage,
            category, // Send filters to backend
            color
          }
        });
        setProducts(res.data.products);
        setTotalProducts(res.data.totalCount);
      } catch (error) {
        console.error("Product Fetch Error:", error.response || error.message);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [currentPage, productsPerPage, category, color]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setShow(false);
    };
  
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);  

  const resetFilters = () => {
    setCategory("");
    setColor("");
  };

  const filteredProducts = products
    .filter((p) =>
      (category === "" || p.category === category) &&
      (color === "" || p.color === color)
    );

  const handleAddToCart = async (product) => {
    if (!user) {
      toast.error("You must be logged in to add items to the cart.");
      return;
    }

    const cartItem = { productId: product.product_id };
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

  // Calculate page numbers
  const pageNumbers = [];
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  
  // Show limited page numbers (e.g., 5 at a time)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);
  
  if (currentPage <= 3) {
    endPage = Math.min(5, totalPages);
  }
  if (currentPage >= totalPages - 2) {
    startPage = Math.max(1, totalPages - 4);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return (
      <div className="loading">
        <FaSpinner className="spinner" />
        <p>جارى تحميل المنتجات . . .</p>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={() => setShow(true)} className={`${styles.sidebutton} ${show ? styles.sidebuttonShifted : ""}`}>
        فلترة المنتجات
      </Button>

      <Offcanvas show={show} onHide={() => setShow(false)} placement="end" className={styles.Offcanvas}>
        <Offcanvas.Body>
          <div className={styles.filter}>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">الفـــــئة</option>
              <option value="quran">آيات قرآنية</option>
              <option value="art">طابع فنى</option>
              <option value="kids">اطفال</option>
            </select>
            <select value={color} onChange={(e) => setColor(e.target.value)}>
              <option value="">الالــــوان</option>
              <option value="cold">باردة</option>
              <option value="warm">دافئة</option>
            </select>
            <button onClick={resetFilters}>- إلغاء الفلتر</button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Product grid */}
      <div className="prodcont">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product.product_id}
              className="product"
              onClick={() => navigate(`/product/${product.product_id}`)}
            >
              <div className="imgcont">
                <img
                  src={product.image_url && product.image_url.startsWith("http") ? product.image_url : `http://localhost:5000${product.image_url || ""}`}
                  alt={product.name}
                />
              </div>

              <div className="detcont">
                <h3>{product.name}</h3>
                <button onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}>أضف إلى السلة</button>
              </div>
            </div>
          ))
        ) : (
          <p className="warn">لم نجد منتجات</p>
        )}
      </div>

        {/* Enhanced Pagination */}
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
            >
              الأولى
            </button>
            
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
            >
              السابق
            </button>
            
            {startPage > 1 && <span>...</span>}
            
            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => setCurrentPage(number)}
                className={currentPage === number ? 'active' : ''}
              >
                {number}
              </button>
            ))}
            
            {endPage < totalPages && <span>...</span>}
            
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              التالي
            </button>
            
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              الأخيرة
            </button>
          </div>
    </div>
  );
};

export default Products;
