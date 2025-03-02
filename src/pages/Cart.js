import { useSelector, useDispatch } from "react-redux";
import { removeFromCart } from "../redux/cartSlice";
import { useNavigate } from "react-router-dom";  // ✅ Import useNavigate

const Cart = () => {
  const { cartItems, totalQuantity, totalPrice } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate(); // ✅ Initialize navigation

  return (
    <div>
      <h2>Shopping Cart</h2>
      <p>Total Items: {totalQuantity}</p>
      <p>Total Price: ${totalPrice.toFixed(2)}</p>

      {cartItems.length === 0 ? (
        <p>Cart is empty</p>
      ) : (
        cartItems.map((item) => (
          <div key={item.id}>
            <h3>{item.title}</h3>
            <p>Price: ${item.price}</p>
            <p>Quantity: {item.quantity}</p>
            <button onClick={() => dispatch(removeFromCart(item.id))}>Remove</button>
          </div>
        ))
      )}

      {/* ✅ Checkout Button - Navigates to Checkout Page */}
      {cartItems.length > 0 && (
        <button onClick={() => navigate("/checkout")}>Proceed to Checkout</button>
      )}
    </div>
  );
};

export default Cart;
