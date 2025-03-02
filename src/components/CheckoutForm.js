import { useState } from "react";

const CheckoutForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    paymentMethod: "credit-card",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Order placed successfully!");
    console.log("Checkout Data:", formData);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Checkout</h2>
      
      <label>Name:</label>
      <input type="text" name="name" value={formData.name} onChange={handleChange} required />
      
      <label>Email:</label>
      <input type="email" name="email" value={formData.email} onChange={handleChange} required />
      
      <label>Address:</label>
      <input type="text" name="address" value={formData.address} onChange={handleChange} required />
      
      <label>City:</label>
      <input type="text" name="city" value={formData.city} onChange={handleChange} required />
      
      <label>ZIP Code:</label>
      <input type="text" name="zip" value={formData.zip} onChange={handleChange} required />
      
      <label>Payment Method:</label>
      <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
        <option value="credit-card">Credit Card</option>
        <option value="paypal">PayPal</option>
        <option value="cash">Cash on Delivery</option>
      </select>

      <button type="submit">Place Order</button>
    </form>
  );
};

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "400px",
    margin: "auto",
    gap: "10px",
  },
};

export default CheckoutForm;
