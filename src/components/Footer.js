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
      backgroundColor: "white",
      width: "100%",
    },
  };
  
  export default Footer;
  