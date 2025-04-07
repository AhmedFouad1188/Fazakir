import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.is_admin; // Check Redux for admin status
  const isLoading = useSelector((state) => state.auth.isLoading);

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
  const [loadingProducts, setLoadingProducts] = useState(true); // New state for product loading

  // ✅ Ensure authentication & admin check before accessing Dashboard
  useEffect(() => {
    if (isLoading) return; // ✅ Wait until loading is done
    
    if (user === null) {
      toast.error("Please log in.");
      navigate("/login");
    } else if (!isAdmin) {
      toast.error("Access denied: Admins only.");
      navigate("/");
    }
  }, [user, isLoading, isAdmin, navigate]);

  // ✅ Fetch products only if user is admin
  useEffect(() => {
    if (user && isAdmin) {
      fetchProducts();
    }
  }, [user, isAdmin]);

  // ✅ Fetch products from backend
  const fetchProducts = async () => {
    setLoadingProducts(true); // Show loading state
    try {
      const response = await axios.get("http://localhost:5000/api/products", { withCredentials: true });

      if (response.data.length === 0) {
        console.log("No products available.");
      }

      setProducts(response.data);
    } catch (error) {
      toast.error("Error fetching products. Please try again later.");
    } finally {
      setLoadingProducts(false);
    }
  };

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
      await axios.delete(`http://localhost:5000/api/products/${product_id}`, { withCredentials: true });
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Error deleting product. Please try again.");
    }
  };

  if (isLoading || loadingProducts) return <p>Loading...</p>;

  return (
    <div>
      <h2>Dashboard</h2>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="text" name="name" placeholder="Product Name" value={product.name} onChange={handleChange} required />
        <input type="number" name="price" placeholder="Price" value={product.price} onChange={handleChange} required />
        <input type="text" name="description" placeholder="Description" value={product.description} onChange={handleChange} required />
        <input type="number" name="stock" placeholder="Stock" value={product.stock} onChange={handleChange} required />
        <input type="file" id="fileInput" name="image" accept="image/*" onChange={handleImageChange} />
        {preview && <img src={preview} alt="Preview" width="100" />}
        <button type="submit">{editingProductId ? "Update Product" : "Add Product"}</button>
      </form>

      <h3>Product List</h3>
      {loadingProducts ? (
        <p>Loading products...</p>
      ) : products.length > 0 ? (
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
            {products.map((product) => (
              <tr key={product.product_id}>
                <td>{product.name}</td>
                <td>${product.price}</td>
                <td>{product.description}</td>
                <td>{product.stock}</td>
                <td>
                  {product.image_url && <img src={`http://localhost:5000${product.image_url}`} alt={product.name} width="50" />}
                </td>
                <td>
                  <button onClick={() => handleEdit(product)}>Edit</button>
                  <button onClick={() => handleDelete(product.product_id)} style={{ marginLeft: "10px", color: "red" }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No products found.</p>
      )}
    </div>
  );
};

export default Dashboard;
