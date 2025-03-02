import { useContext } from "react";
import { CartContext } from "../context/CartContext";

const Cart = () => {
  const { cart, removeFromCart } = useContext(CartContext);

  return (
    <div>
      <h1>Shopping Cart</h1>
      {cart.length === 0 ? <p>Cart is empty</p> : null}
      {cart.map((item) => (
        <div key={item.id}>
          <h3>{item.title}</h3>
          <p>${item.price}</p>
          <button onClick={() => removeFromCart(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
};

export default Cart;
