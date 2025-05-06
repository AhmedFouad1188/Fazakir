import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

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
              title: `Update ${product.name} ?`,
              message: `Are you sure you want to update ${product.name} ?`,
              buttons: [
                {
                  label: 'Yes',
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
                  label: 'No'
                  // No action needed; this closes the dialog
                }
              ]
            });
        });
      } else {
        confirmAlert({
          title: 'Add Product ?',
          message: `Are you sure you want to add this product ?`,
          buttons: [
            {
              label: 'Yes',
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
              label: 'No'
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
      title: `Delete ${product.name} ?`,
      message: `Are you sure you want to delete ${product.name} ?`,
      buttons: [
        {
          label: 'Yes',
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
          label: 'No'
          // No action needed; this closes the dialog
        }
      ]
    });
  };

  const handleRestore = async (product) => {
    confirmAlert({
      title: `Restore ${product.name} ?`,
      message: `Are you sure you want to restore ${product.name} ?`,
      buttons: [
        {
          label: 'Yes',
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
          label: 'No'
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
    <div>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="text" name="name" placeholder="Product Name" value={product.name} onChange={handleChange} required />
        <input type="number" name="price" placeholder="Price" value={product.price} onChange={handleChange} required />
        <input type="text" name="description" placeholder="Description" value={product.description} onChange={handleChange} required />
        <select name="category" value={product.category} onChange={handleChange} required>
          <option value="">Select Category ...</option>
          <option>Quran</option>
          <option>Modern</option>
          <option>Kids</option>
        </select>

        <div style={{ marginBottom: "10px" }}>
          {previews.map((src, index) => (
            <div key={index} style={{ marginBottom: "10px" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, index)}
              />
              {src && <img src={src} alt={`Preview ${index}`} width="100" />}
              <button type="button" onClick={() => removeInput(index)} style={{ marginLeft: "5px", color: "red" }}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addInput}
            disabled={previews.length >= 5}
            style={{
              backgroundColor: previews.length >= 5 ? "gray" : "blue",
              color: "white",
              padding: "8px 12px",
              borderRadius: "5px",
              marginTop: "10px",
              cursor: previews.length >= 5 ? "not-allowed" : "pointer",
            }}
          >
            Add Image
          </button>

        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <FaSpinner className="spinner" />
              Saving...
            </>
          ) : editingProductId ? (
            "Update Product"
          ) : (
            "Add Product"
          )}
        </button>
      </form>

      <h2>Products</h2>
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: "10px", padding: "5px", width: "300px" }}
      />

      <table border="1">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Description</th>
            <th>Category</th>
            <th>Images</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products
            .filter((product) =>
              `${product.name} ${product.description}`.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((product) => (
              <tr key={product.product_id}>
                <td onClick={() => navigate(`/product/${product.product_id}`)} style={{ cursor: "pointer" }}>{product.name}</td>
                <td>{product.price}</td>
                <td>{product.description}</td>
                <td>{product.category}</td>
                <td style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {product.image_url &&
                    product.image_url.map((url, idx) => (
                      <img
                        key={`${product.product_id}-${idx}`}
                        src={`http://localhost:5000${url}`}
                        alt={product.name}
                        width="50"
                        height="50"
                        style={{ objectFit: "cover" }}
                      />
                    ))}
                </td>
                <td>
                  {product.isdeleted ? (
                    <>
                      <span style={{ color: "red", fontWeight: "bold" }}>Deleted</span>
                      <br />
                      <button onClick={() => handleRestore(product)} style={{ marginTop: "5px", color: "green" }}>
                        Restore
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(product)}>Edit</button>
                      <button onClick={() => handleDelete(product)} style={{ marginLeft: "10px", color: "red" }}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsPanel;
