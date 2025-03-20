import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import toast styles

const Dashboard = () => {
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/products");
      setProducts(response.data);
    } catch (error) {
      toast.error("Error fetching products");
    }
  };

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file)); // Show preview of selected image
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("price", product.price);
    formData.append("description", product.description);
    formData.append("stock", product.stock);
    if (imageFile) {
      formData.append("image", imageFile);
    } else {
      formData.append("image_url", product.image_url); // Keep existing image
    }

    try {
      if (editingProductId) {
        await axios.put(`http://localhost:5000/products/${editingProductId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product updated successfully");
      } else {
        await axios.post("http://localhost:5000/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product added successfully");
      }

      setProduct({ name: "", price: "", description: "", stock: "", image_url: "" });
      setImageFile(null);
      setPreview(null);
      setEditingProductId(null);
      fetchProducts();
    } catch (error) {
      toast.error("Error saving product");
    }
  };

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setProduct({ name: product.name, price: product.price, description: product.description, stock: product.stock, image_url: product.image_url });
    setPreview(product.image_url ? `http://localhost:5000${product.image_url}` : null);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/products/${id}`);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Error deleting product");
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <ToastContainer /> {/* Toast Container for displaying notifications */}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="text" name="name" placeholder="Product Name" value={product.name} onChange={handleChange} required />
        <input type="number" name="price" placeholder="Price" value={product.price} onChange={handleChange} required />
        <input type="text" name="description" placeholder="Description" value={product.description} onChange={handleChange} required />
        <input type="number" name="stock" placeholder="Stock" value={product.stock} onChange={handleChange} required />
        <input type="file" name="image" accept="image/*" onChange={handleImageChange} />
        {preview && <img src={preview} alt="Preview" width="100" />}
        <button type="submit">{editingProductId ? "Update Product" : "Add Product"}</button>
      </form>

      <h3>Product List</h3>
      {products.length > 0 ? (
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
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>${product.price}</td>
                <td>{product.description}</td>
                <td>{product.stock}</td>
                <td>{product.image_url && <img src={`http://localhost:5000${product.image_url}`} alt={product.name} width="50" />}</td>
                <td>
                  <button onClick={() => handleEdit(product)}>Edit</button>
                  <button onClick={() => handleDelete(product.id)} style={{ marginLeft: "10px", color: "red" }}>
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
