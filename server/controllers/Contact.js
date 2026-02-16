import { createError } from "../error.js";
import ContactMessage from "../models/ContactMessage.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      return next(createError(400, "Name, email, and message are required"));
    }
    if (!isValidEmail(String(email))) {
      return next(createError(400, "Please enter a valid email address"));
    }

    const created = await ContactMessage.create({
      name: String(name),
      email: String(email),
      message: String(message),
      user: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Message received",
      id: created._id,
    });
  } catch (err) {
    return next(err);
  }
};

