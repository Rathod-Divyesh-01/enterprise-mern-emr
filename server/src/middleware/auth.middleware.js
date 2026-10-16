const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Access token missing or invalid format",
      });
  }

  const token = authHeader.split(" ")[1];
  try {
    if (!process.env.JWT_ACCESS_SECRET) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Authentication secret is not configured",
        });
    }
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select(
      "name email role isActive",
    );
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Account is inactive or no longer exists",
        });
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Token expired or unauthorized" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Forbidden: Insufficient role permissions",
        });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
