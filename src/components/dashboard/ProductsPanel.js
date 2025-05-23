import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import styles from "../../styles/productspanel.module.css";

const ProductsPanel = () => {
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/products/dashboard_fetch", { withCredentials: true });
      setProducts(res.data);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
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
    formData.append("price", product.price);
    formData.append("description", product.description);
    formData.append("category", product.category);
    imageFiles.forEach((file) => {
      if (file) formData.append("images", file);
    });

    try {
      if (editingProductId) {
        existingImageUrls.forEach(url => {
          formData.append("remainingImages", url);
        
            confirmAlert({
              title: `تحديث ${product.name} ؟`,
              message: `تأكيد تحديث ${product.name} ؟`,
              buttons: [
                {
                  label: 'نعم',
                  onClick: async () => {

                    await axios.put(`http://localhost:5000/api/products/${editingProductId}`, formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                      withCredentials: true,
                    });
                    toast.success(`${product.name} updated successfully`);
                    fetchProducts();
                  }
                },
                {
                  label: 'لا'
                  // No action needed; this closes the dialog
                }
              ]
            });
        });
      } else {
        confirmAlert({
          title: 'إضافة منتج ؟',
          message: `هل تريد إضافة هذا المنتج ؟`,
          buttons: [
            {
              label: 'نعم',
              onClick: async () => {

                await axios.post("http://localhost:5000/api/products/add", formData, {
                  headers: { "Content-Type": "multipart/form-data" },
                  withCredentials: true,
                });
                toast.success("Product added successfully");
                fetchProducts();
              }
            },
            {
              label: 'لا'
              // No action needed; this closes the dialog
            }
          ]
        });
      }
        
      setProduct({ name: "", price: "", description: "", category: "" });
      setImageFiles([]);
      setPreviews([]);
      setEditingProductId(null);
      setExistingImageUrls([]);
    } catch (error) {
      toast.error("Error saving product. Please check your input and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProductId(product.product_id);
    setProduct({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
    });
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
      title: `إزالة ${product.name} ؟`,
      message: `هل انت متأكد انك تريد إزالة ${product.name} ؟`,
      buttons: [
        {
          label: 'نعم',
          onClick: async () => {
            try {
              await axios.put(`http://localhost:5000/api/products/${product.product_id}/delete`, null, { withCredentials: true });
              toast.success(`${product.name} deleted successfully`);
              fetchProducts();
            } catch (error) {
              toast.error("Error deleting product. Please try again.");
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
              toast.success(`${product.name} restored successfully`);
              fetchProducts();
            } catch (error) {
              toast.error("Failed to restore product");
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
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <FaSpinner className="spinner" style={{ fontSize: "30px", animation: "spin 1s linear infinite" }} />
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>إضافة منتج</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="text" name="name" placeholder="اسم المنتج" value={product.name} onChange={handleChange} required />

        <input type="text" name="description" placeholder="الوصف" value={product.description} onChange={handleChange} required />

        <input type="number" name="price" placeholder="السعر" value={product.price} onChange={handleChange} required />

        <select name="category" value={product.category} onChange={handleChange} required>
          <option value="">اختار الفئة</option>
          <option value="quran">آيات قرآنية</option>
          <option value="art">طابع فنى</option>
          <option value="kids">أطفال</option>
        </select>

        <div>
          {previews.map((src, index) => (
            <div key={index} className={styles.preview}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, index)}
              />
              {src && <img src={src} alt={`Preview ${index}`} width="100" />}
              <button type="button" onClick={() => removeInput(index)} style={{backgroundColor: "red"}}>
                مسح
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addInput}
            disabled={previews.length >= 5}
            style={{
              backgroundColor: previews.length >= 5 ? "gray" : "#a38483",
              cursor: previews.length >= 5 ? "not-allowed" : "pointer",
            }}
          >
            إضافة صورة
          </button>
        </div>

        <button type="submit" disabled={submitting} className={styles.add}>
          {submitting ? (
            <>
              <FaSpinner className="spinner" />
              Saving...
            </>
          ) : editingProductId ? (
            "تحديث منتج"
          ) : (
            "إضافة منتج"
          )}
        </button>
      </form>

      <input
        type="text"
        placeholder="بحث فى المنتجات ..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div>
        {products
          .filter((product) =>
            `${product.name} ${product.description}`.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((product) => (
            <div key={product.product_id} className={styles.product}>
              <div onClick={() => navigate(`/product/${product.product_id}`)} className={styles.productdet}>
                <p><span>اسم المنتج</span> {product.name}</p>
                <p><span>الوصف</span> {product.description}</p>
                <p><span>السعر</span> {product.price}</p>
                <p><span>الفئة</span> {product.category}</p>
                <span>الصور</span>
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
                      <p className={styles.deleted}>Deleted</p>
                      <button onClick={() => handleRestore(product)} className={styles.buttonalign} style={{backgroundColor: "#25b425"}}>
                        إعادة
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleDelete(product)} style={{backgroundColor: "red"}}>
                        مسح
                      </button>
                      <button 
                        onClick={() => { handleEdit(product); window.scrollTo({ top: 0, behavior: "smooth" }) }} 
                        className={styles.buttonalign} 
                        style={{backgroundColor: "#0f79fa"}}
                      >
                        تعديل
                      </button>
                    </>
                  )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default ProductsPanel;
