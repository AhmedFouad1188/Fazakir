const normalizeUser = (req, res, next) => {
    if (req.user) {
      req.user.is_admin = Boolean(req.user.is_admin);
    }
    next();
  };
  
  module.exports = normalizeUser;
