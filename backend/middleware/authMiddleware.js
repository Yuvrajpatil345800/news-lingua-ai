import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "news_lingua_ai_super_secret_jwt_key_2026";

/**
 * Require valid authentication token
 */
const decodeUser = async (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please sign in.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = await decodeUser(token);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session token. Please sign in again.",
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token provided)
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      req.user = await decodeUser(token);
    } catch {
      // Ignore token errors for optional auth
    }
  }
  next();
};
