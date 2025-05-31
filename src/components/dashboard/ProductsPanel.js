import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaSpinner, FaTimes } from "react-icons/fa";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import styles from "../../styles/productspanel.module.css";
import { mapToArabic } from "../../utils/mapToArabic";

const ProductsPanel = () => {
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    color: "",
  });
  const [previews, setPreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [dimensions, setDimensions] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10); // You can adjust this number
  const [totalProducts, setTotalProducts] = useState(0);

  // Add debouncing for search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
      const timerId = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
        setCurrentPage(1); // Reset to first page when search changes
      }, 500);
  
      return () => {
        clearTimeout(timerId);
      };
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products/dashboard_fetch", { 
        withCredentials: true,
        params: {
          page: currentPage,
          limit: productsPerPage,
          search: debouncedSearchTerm
        }
      });
      setProducts(res.data.products);
      setTotalProducts(res.data.totalCount);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, productsPerPage, debouncedSearchTerm]);

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

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const addInputDimensions = () => {
    setDimensions((prev) => [...prev, { width: "", height: "" }]);
  };

  const removeInputDimensions = (index) => {
    setDimensions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDimensionChange = (index, e) => {
    const { name, value } = e.target;
    setDimensions(prev => prev.map((dim, i) => 
      i === index ? { ...dim, [name]: value } : dim
    ));
  };

  const addInput = () => {
    if (previews.length >= 5) {
      toast.warning("You can only upload up to 5 images.");
      return;
    }
    setPreviews((prev) => [...prev, ""]);
    setImageFiles((prev) => [...prev, null]);
  };  

  const removeInput = (index) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => {
          const newPreviews = [...prev];
          newPreviews[index] = reader.result;
          return newPreviews;
        });
      };
      reader.readAsDataURL(file);

      setImageFiles((prev) => {
        const newFiles = [...prev];
        newFiles[index] = file;
        return newFiles;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("description", product.description);
    formData.append("category", product.category);
    formData.append("color", product.color);
    
    // Handle dimensions - stringify the array for backend parsing
    formData.append("dimensions", JSON.stringify(dimensions));
    
    // Add image files
    imageFiles.forEach((file) => {
        if (file) formData.append("images", file);
    });

    try {
        if (editingProductId) {
            // Add remaining images for update case
            existingImageUrls.forEach(url => {
                formData.append("remainingImages", url);
            });

            await new Promise((resolve) => {
                confirmAlert({
                    title: `تحديث ${product.name} ؟`,
                    message: `تأكيد تحديث ${product.name} ؟`,
                    buttons: [
                        {
                            label: 'نعم',
                            onClick: async () => {
                                try {
                                    const response = await axios.put(
                                        `http://localhost:5000/api/products/${editingProductId}`,
                                        formData,
                                        {
                                            headers: { "Content-Type": "multipart/form-data" },
                                            withCredentials: true,
                                        }
                                    );
                                    
                                    fetchProducts();
                                    toast.success(`تم تحديث ${product.name} بنجاح`);
                                    resetForm();
                                    resolve();
                                } catch (error) {
                                    console.error("Update error:", error.response?.data || error.message);
                                    toast.error(error.response?.data?.message || "لم نتمكن من تحديث المنتج. حاول مرة اخرى");
                                    resolve();
                                }
                            }
                        },
                        {
                            label: 'لا',
                            onClick: () => resolve()
                        }
                    ]
                });
            });
        } else {
            await new Promise((resolve) => {
                confirmAlert({
                    title: 'إضافة منتج ؟',
                    message: `هل تريد إضافة هذا المنتج ؟`,
                    buttons: [
                        {
                            label: 'نعم',
                            onClick: async () => {
                                try {
                                    const response = await axios.post(
                                        "http://localhost:5000/api/products/add",
                                        formData,
                                        {
                                            headers: { "Content-Type": "multipart/form-data" },
                                            withCredentials: true,
                                        }
                                    );
                                    
                                    fetchProducts();
                                    toast.success("تم إضافة المنتج بنجاح");
                                    resetForm();
                                    resolve();
                                } catch (error) {
                                    console.error("Create error:", error.response?.data || error.message);
                                    toast.error(error.response?.data?.message || "لم نتمكن من إضافة المنتج. حاول مرة اخرى");
                                    resolve();
                                }
                            }
                        },
                        {
                            label: 'لا',
                            onClick: () => resolve()
                        }
                    ]
                });
            });
        }
    } catch (error) {
        console.error("Submission error:", error);
        toast.error("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى");
    } finally {
        setSubmitting(false);
    }
};

// Helper function to reset form
const resetForm = () => {
  setProduct({ name: "", description: "", category: "", color: "" });
  setDimensions([]);
  setPreviews([]);
  setImageFiles([]);
  setExistingImageUrls([]);
  setEditingProductId(null);
};

  const handleEdit = (product) => {
    setEditingProductId(product.product_id);
    setProduct({
      name: product.name,
      description: product.description,
      category: product.category,
      color: product.color,
    });

    if (product.dimensions) {
      const formattedDimensions = product.dimensions.map(dim => ({
        width: dim.width,
        height: dim.height,
        price: dim.price
      }));
      setDimensions(formattedDimensions);
    } else {
      setDimensions([]);
    }

    if (product.image_url) {
      const fullUrls = product.image_url.map(url => `http://localhost:5000${url}`);
      setPreviews(fullUrls);
      setExistingImageUrls(product.image_url); // store raw backend paths like "/uploads/xyz.webp"
      setImageFiles(product.image_url.map(() => null));
    } else {
      setPreviews([]);
      setImageFiles([]);
    }
  };

  const handleDelete = async (product) => {
    confirmAlert({
      title: `حذف ${product.name} ؟`,
      message: `هل انت متأكد انك تريد حذف ${product.name} ؟`,
      buttons: [
        {
          label: 'نعم',
          onClick: async () => {
            try {
              await axios.put(`http://localhost:5000/api/products/${product.product_id}/delete`, null, { withCredentials: true });
              fetchProducts();
              toast.success(`تم حذف ${product.name} بنجاح`);
            } catch (error) {
              toast.error("لم نتمكن من حذف المنتج. حاول مرة اخرى");
            }
          }
        },
        {
          label: 'لا'
          // No action needed; this closes the dialog
        }
      ]
    });
  };

  const handleRestore = async (product) => {
    confirmAlert({
      title: `إعادة ${product.name} ؟`,
      message: `هل تريد إعادة ${product.name} ؟`,
      buttons: [
        {
          label: 'نعم',
          onClick: async () => {
            try {
              await axios.put(`http://localhost:5000/api/products/${product.product_id}/restore`, null, { withCredentials: true });
              fetchProducts();
              toast.success(`تم إعادة ${product.name} بنجاح`);
            } catch (error) {
              toast.error("لم نتمكن من إعادة المنتج. حاول مرة اخرى");
            }
          }
        },
        {
          label: 'لا'
          // No action needed; this closes the dialog
        }
      ]
    });
  };

  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  if (loading) {
    return (
      <div className="loading">
        <FaSpinner className="spinner" />
        <p>جارى تحميل المنتجات . . .</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3>إضافة منتج</h3>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="text" name="name" placeholder="اسم المنتج" value={product.name} onChange={handleChange} required />

        <textarea name="description" placeholder="الوصف" value={product.description} onChange={handleChange} required />

        <select name="category" value={product.category} onChange={handleChange} required>
          <option value="">حدد الفئة</option>
          <option value="quran">آيات قرآنية</option>
          <option value="art">طابع فنى</option>
          <option value="kids">أطفال</option>
        </select>

        <select name="color" value={product.color} onChange={handleChange} required>
          <option value="">حدد نوع الالوان</option>
          <option value="warm">الوان دافئة</option>
          <option value="cold">الوان باردة</option>
        </select>

        <div>
          {dimensions.map((dim, index) => (
            <div key={index}>
              <input
                type="number" 
                min="1"
                name="width" 
                value={dim.width} 
                onChange={(e) => handleDimensionChange(index, e)} 
                placeholder="العرض" 
                required 
              />
              <input 
                type="number" 
                min="1"
                name="height" 
                value={dim.height}
                onChange={(e) => handleDimensionChange(index, e)} 
                placeholder="الارتفاع" 
                required 
              />
              <input
                type="number"
                min="1"
                name="price"
                value={dim.price}
                onChange={(e) => handleDimensionChange(index, e)} 
                placeholder="السعر"
                required
              />
              <button type="button" onClick={() => removeInputDimensions(index)} className="danger">
                حذف
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addInputDimensions}
            className="cold"
          >
            إضافة مقاس و سعر
          </button>
        </div>

        <div>
          {previews.map((src, index) => (
            <div key={index} className={styles.preview}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, index)}
              />
              {src && <img src={src} alt={`Preview ${index}`} width="100" />}
              <button type="button" onClick={() => removeInput(index)} className="danger">
                حذف
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addInput}
            disabled={previews.length >= 5}
            style={{
              backgroundColor: previews.length >= 5 ? "gray" : "#0f79fa",
              cursor: previews.length >= 5 ? "not-allowed" : "pointer",
            }}
          >
            إضافة صورة
          </button>
        </div>

        <button type="submit" disabled={submitting} className="good">
          {submitting ? (
            <>
              <FaSpinner className="spinner" />
              Saving...
            </>
          ) : editingProductId ? (
            "تحديث المنتج"
          ) : (
            "حفظ المنتج"
          )}
        </button>
      </form>

      <div className="search">
        <input
          type="text"
          placeholder="بحث فى المنتجات . . ."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <FaTimes 
            className="clear"
            onClick={() => setSearchTerm('')}
          />
        )}
      </div>

      {products.length === 0 ? (
        <p className="warn">لم نجد أى منتجات تتوافق مع كلمات البحث</p>
      ) : (
        <>
          {products.map((product) => (
              <div key={product.product_id} className="paneldet">
                <div onClick={() => navigate(`/product/${product.product_id}`)} style={{ cursor: "pointer" }}>
                  <p><span>اسم المنتج</span> {product.name}</p>
                  <p><span>الوصف</span> {product.description}</p>
                  <p><span>الفئة</span> {mapToArabic(product.category).text}</p>
                  <p><span>نوع الالوان</span> {mapToArabic(product.color).text}</p>
                  <p><span>المقاسات والاسعار</span></p>
                  <div>
                    {product.dimensions &&
                      product.dimensions.map((dim, idx) => (
                        <div key={`${product.product_id}-${idx}`}>
                        <p><span>العرض</span> {dim.width}</p>
                        <p><span>الارتفاع</span> {dim.height}</p>
                        <p><span>السعر</span> {dim.price}</p>
                        </div>
                      ))
                    }
                  </div>
                  <p><span>الصور</span></p>
                  <div className={styles.images}>
                    {product.image_url &&
                      product.image_url.map((url, idx) => (
                        <img
                          key={`${product.product_id}-${idx}`}
                          src={`http://localhost:5000${url}`}
                          alt={product.name}
                        />
                      ))
                    }
                  </div>
                </div>
                <div className={styles.actions}> 
                  {product.isdeleted ? (
                      <>
                        <p style={{ color: "red", fontWeight: "bold" }}>محذوف</p>
                        <button onClick={() => handleRestore(product)} className="good buttonalign">
                          إعادة
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { handleEdit(product); window.scrollTo({ top: 0, behavior: "smooth" }) }} 
                          className="cold"
                        >
                          تعديل
                        </button>
                        <button onClick={() => handleDelete(product)} className="danger buttonalign">
                          حذف
                        </button>
                      </>
                    )}
                </div>
              </div>
            ))
          }
  
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
        </>
      )}
    </div>
  );
};

export default ProductsPanel;
