import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createError } from "../error.js";
import User from "../models/User.js";
import Orders from "../models/Orders.js";
import Products from "../models/Products.js";

dotenv.config();

const getJwtSecret = () => {
  const secret = process.env.JWT;
  if (!secret) throw createError(500, "Server misconfigured: JWT secret missing");
  return secret;
};

const sanitizeUser = (userDoc) => {
  if (!userDoc) return userDoc;
  const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete obj.password;
  return obj;
};

//user register controller
export const UserRegister = async (req, res, next) => {
  try {
    const { email, password, name, img } = req.body;
    if (!email || !password || !name) {
      return next(createError(400, "Name, email, and password are required"));
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createError(409, "Email is already in use"));
    }
    const salt = bcrypt.genSaltSync(10);
    const hashedpassword = bcrypt.hashSync(password, salt);

    const user = new User({
      name,
      email,
      password: hashedpassword,
      img,
    });
    const createdUser = await user.save();
    const token = jwt.sign(
      { id: createdUser._id },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
    );
    return res.status(201).json({ token, user: sanitizeUser(createdUser) });
  } catch (error) {
    return next(error);
  }
};

//user login controller
export const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(createError(400, "Email and password are required"));
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return next(createError(404, "user not found"));
    }

    const isPasswordCorrect = bcrypt.compareSync(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      return next(createError(403, "Incorrect password"));
    }
    const token = jwt.sign(
      { id: existingUser._id },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
    );
    return res.status(200).json({ token, user: sanitizeUser(existingUser) });
  } catch (error) {
    return next(error);
  }
};

// Cart
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userJWT = req.user;
    const user = await User.findById(userJWT.id);
    const existingCartItemIndex = user.cart.findIndex((item) =>
      item?.product?.equals(productId)
    );
    if (existingCartItemIndex !== -1) {
      // Product is already in the cart, update the quantity
      user.cart[existingCartItemIndex].quantity += quantity;
    } else {
      // Product is not in the cart, add it
      user.cart.push({ product: productId, quantity });
    }
    await user.save();

    return res
      .status(200)
      .json({ message: "Product added to cart successfully", user });
  } catch (err) {
    next(err);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userJWT = req.user;
    const user = await User.findById(userJWT.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const productIndex = user.cart.findIndex((item) =>
      item.product.equals(productId)
    );
    if (productIndex !== -1) {
      if (quantity && quantity > 0) {
        user.cart[productIndex].quantity -= quantity;
        if (user.cart[productIndex].quantity <= 0) {
          user.cart.splice(productIndex, 1);
        }
      } else {
        user.cart.splice(productIndex, 1);
      }

      await user.save();
      return res
        .status(200)
        .json({ message: "Product quantity updated in cart", user });
    } else {
      return next(createError(404, "Product not found in the user's cart"));
    }
  } catch (err) {
    next(err);
  }
};

export const getAllCartItems = async (req, res, next) => {
  try {
    const userJWT = req.user;
    const user = await User.findById(userJWT.id).populate({
      path: "cart.product",
      model: "Products",
    });
    const cartItems = user.cart;
    return res.status(200).json(cartItems);
  } catch (err) {
    next(err);
  }
};

// Order

export const placeOrder = async (req, res, next) => {
  try {
    const { products, address, totalAmount, payment } = req.body;
    const userJWT = req.user;
    const user = await User.findById(userJWT.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }
    if (!Array.isArray(products) || products.length === 0) {
      return next(createError(400, "products must be a non-empty array"));
    }
    if (!address) {
      return next(createError(400, "address is required"));
    }

    const normalized = products
      .map((p) => ({
        productId: p?.productId || p?.product || p?.product?._id,
        quantity: Number(p?.quantity || 0),
      }))
      .filter((p) => p.productId && Number.isFinite(p.quantity) && p.quantity > 0);

    if (normalized.length === 0) {
      return next(createError(400, "No valid products in order"));
    }

    const uniqueIds = [...new Set(normalized.map((p) => String(p.productId)))];
    const dbProducts = await Products.find({ _id: { $in: uniqueIds } }).select(
      "_id price"
    );
    if (dbProducts.length !== uniqueIds.length) {
      return next(createError(400, "One or more products are invalid"));
    }

    const productMap = new Map(dbProducts.map((p) => [String(p._id), p]));
    const computedTotal = normalized.reduce((sum, item) => {
      const prod = productMap.get(String(item.productId));
      const price = Number(prod?.price?.org || 0);
      return sum + price * item.quantity;
    }, 0);

    const order = new Orders({
      products: normalized.map((p) => ({
        product: p.productId,
        quantity: p.quantity,
      })),
      user: user._id,
      total_amount: mongoose.Types.Decimal128.fromString(
        Number.isFinite(computedTotal)
          ? computedTotal.toFixed(2)
          : Number(totalAmount || 0).toFixed(2)
      ),
      address: String(address),
      status:
        payment?.mode === "cod"
          ? "Cash on Delivery"
          : payment?.simulated
            ? "Paid (Simulated)"
            : "Payment Pending",
    });
    await order.save();

    user.cart = [];
    await user.save();

    return res
      .status(200)
      .json({ message: "Order placed successfully", order });
  } catch (err) {
    next(err);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const user = req.user;
    const orders = await Orders.find({ user: user.id })
      .populate({ path: "products.product", model: "Products" })
      .sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
};

//Favourite

export const addToFavorites = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userJWT = req.user;
    const user = await User.findById(userJWT.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }
    if (!productId) {
      return next(createError(400, "productId is required"));
    }

    if (!user.favourites.includes(productId)) {
      user.favourites.push(productId);
      await user.save();
    }

    return res
      .status(200)
      .json({
        message: "Product added to favorites successfully",
        user: sanitizeUser(user),
      });
  } catch (err) {
    next(err);
  }
};

export const removeFromFavorites = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userJWT = req.user;
    const user = await User.findById(userJWT.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }
    if (!productId) {
      return next(createError(400, "productId is required"));
    }

    user.favourites = user.favourites.filter((fav) => !fav.equals(productId));
    await user.save();
    return res
      .status(200)
      .json({
        message: "Product removed from favorites successfully",
        user: sanitizeUser(user),
      });
  } catch (err) {
    next(err);
  }
};

export const getUserFavourites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("favourites").exec();

    if (!user) {
      return next(createError(404, "User not found"));
    }

    return res.status(200).json(user.favourites);
  } catch (err) {
    next(err);
  }
};
