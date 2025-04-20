import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";

const ProductsPanel = () => {
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    stock: "",
    image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
      setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/products/dashboard_fetch", { withCredentials: true });  
      if (res.data.length === 0) {
          console.log("No products available.");
        }  
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

  // ✅ Handle form input changes
  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  // ✅ Handle image selection & preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Handle form submission for adding/editing products
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("price", product.price);
    formData.append("description", product.description);
    formData.append("stock", product.stock);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      if (editingProductId) {
        await axios.put(`http://localhost:5000/api/products/${editingProductId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        toast.success("Product updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/products/add", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        toast.success("Product added successfully");
      };

      // ✅ Reset form after submission
      setProduct({ name: "", price: "", description: "", stock: "", image_url: "" });
      setImageFile(null);
      setPreview(null);
      setEditingProductId(null);
      document.getElementById("fileInput").value = ""; // ✅ Clears file input
      fetchProducts();
    } catch (error) {
      toast.error("Error saving product. Please check your input and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Handle product edit
  const handleEdit = (product) => {
    setEditingProductId(product.product_id);
    setProduct({
      name: product.name,
      price: product.price,
      description: product.description,
      stock: product.stock,
      image_url: product.image_url,
    });
    setPreview(product.image_url ? `http://localhost:5000${product.image_url}` : null);
  };

  // ✅ Handle product delete
  const handleDelete = async (product_id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.put(`http://localhost:5000/api/products/${product_id}/delete`, { withCredentials: true });
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Error deleting product. Please try again.");
    }
  };

  const handleRestore = async (product_id) => {
    try {
      await axios.put(`http://localhost:5000/api/products/${product_id}/restore`, null, {
        withCredentials: true,
      });
      toast.success("Product restored successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to restore product");
    }
  };  

  if (loading) return <p>Loading products...</p>;

  return (
    <div>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="text" name="name" placeholder="Product Name" value={product.name} onChange={handleChange} required />
        <input type="number" name="price" placeholder="Price" value={product.price} onChange={handleChange} required />
        <input type="text" name="description" placeholder="Description" value={product.description} onChange={handleChange} required />
        <input type="number" name="stock" placeholder="Stock" value={product.stock} onChange={handleChange} required />
        <input type="file" id="fileInput" name="image" accept="image/*" onChange={handleImageChange} />
        {preview && <img src={preview} alt="Preview" width="100" />}
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
      {loading ? (
        <p><FaSpinner className="spinner" /> Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <>
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
              <th>Stock</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {products
            .filter((product) =>
              `${product.name} ${product.description}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
            .map((product) => {
              return (
                <tr key={product.product_id}>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td>{product.description}</td>
                  <td>{product.stock}</td>
                  <td>
                    {product.image_url && <img src={`http://localhost:5000${product.image_url}`} alt={product.name} width="50" />}
                  </td>
                  <td>
                    {product.isdeleted ? (
                      <>
                        <span style={{ color: "red", fontWeight: "bold" }}>Deleted</span>
                        <br />
                        <button onClick={() => handleRestore(product.product_id)} style={{ marginTop: "5px", color: "green" }}>
                          Restore
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(product)}>Edit</button>
                        <button onClick={() => handleDelete(product.product_id)} style={{ marginLeft: "10px", color: "red" }}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })
          }
          </tbody>
        </table>
        </>
      )}
    </div>
  );
};

export default ProductsPanel;