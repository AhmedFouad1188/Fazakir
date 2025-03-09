const Footer = () => {
    return (
      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Fazakir. All rights reserved.</p>
      </footer>
    );
  };
  
  const styles = {
    footer: {
      textAlign: "center",
      padding: "1rem",
      backgroundColor: "#333",
      color: "white",
      position: "fixed",
      bottom: "0",
      width: "100%",
    },
  };
  
  export default Footer;
  