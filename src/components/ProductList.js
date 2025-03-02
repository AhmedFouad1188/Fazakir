import ProductCard from "./ProductCard"; // Import the ProductCard component

const ProductList = ({ products }) => {
  return (
    <div style={styles.container}>
      {products.length === 0 ? (
        <p>No products available</p>
      ) : (
        products.map((product) => <ProductCard key={product.id} product={product} />)
      )}
    </div>
  );
};

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    padding: "20px",
  },
};

export default ProductList;
