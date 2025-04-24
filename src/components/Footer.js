const Footer = () => {
    return (
      <footer style={styles.footer}>
        <div>
          <h1>تواصلوا معنا</h1>
        </div>
        <p>&copy; فــذكــر. جميع الحقوق محفوظة {new Date().getFullYear()}</p>
      </footer>
    );
  };
  
  const styles = {
    footer: {
      marginTop: "5vw"
    },
  };
  
  export default Footer;
  