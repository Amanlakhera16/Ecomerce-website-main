import jwt from "jsonwebtoken";
import { createError } from "../error.js";

export const verifyToken = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return next(createError(401, "You are not authenticated!"));
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) return next(createError(401, "You are not authenticated!"));
    const secret = process.env.JWT;
    if (!secret) return next(createError(500, "Server misconfigured: JWT secret missing"));
    const decode = jwt.verify(token, secret);
    req.user = decode;
    return next();
  } catch (err) {
    // Normalize JWT errors into a 401 so the client can log out / re-auth.
    if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
      return next(createError(401, "Invalid or expired token"));
    }
    return next(err);
  }
};
