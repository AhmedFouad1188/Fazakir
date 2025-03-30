const adminOnly = async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized: Please log in" });
      }
  
      // Ensure user is an admin
      if (!req.user.is_admin) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }
  
      next(); // Proceed to the next middleware or route
    } catch (error) {
      res.status(500).json({ error: "Server error: " + error.message });
    }
  };
  
  module.exports = adminOnly;
  