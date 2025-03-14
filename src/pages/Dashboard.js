import { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", description: "" });

  useEffect(() => {
    axios.get("http://localhost:5000/products") // Local backend URL
      .then(response => setProducts(response.data))
      .catch(error => console.error("Error fetching products:", error));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://localhost:5000/products", form)
      .then(() => {
        alert("Product added successfully!");
        window.location.reload(); // Refresh list
      })
      .catch(error => console.error("Error adding product:", error));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="mt-4">
        <input type="text" placeholder="Name" value={form.name} 
               onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2 w-full" />
        <input type="number" placeholder="Price" value={form.price} 
               onChange={(e) => setForm({ ...form, price: e.target.value })} className="border p-2 w-full mt-2" />
        <textarea placeholder="Description" value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} className="border p-2 w-full mt-2"></textarea>
        <button type="submit" className="bg-blue-500 text-white p-2 mt-2">Add Product</button>
      </form>

      {/* Product List */}
      <h2 className="mt-6 text-xl">Product List</h2>
      <ul>
        {products.map(product => (
          <li key={product.id} className="border p-2 mt-2">{product.name} - ${product.price}</li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
