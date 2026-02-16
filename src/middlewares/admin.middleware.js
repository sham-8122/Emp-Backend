exports.isAdmin = (req, res, next) => {
  // Check if the user role from the decoded token is 'admin'
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: "Access Denied: Admins only." });
  }
};