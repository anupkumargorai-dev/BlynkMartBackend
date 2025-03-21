import jwt from "jsonwebtoken";
import User from "../models/user.js";

const authenticateUser = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access Denied.",
      errorCode: "NO_TOKEN",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. User not found.",
        errorCode: "USER_NOT_FOUND",
      });
    }

    next(); // Proceed to the next middleware
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      errorCode: "INVALID_TOKEN",
    });
  }
};

export default authenticateUser;
