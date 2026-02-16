import mongoose from "mongoose";
import Products from "../models/Products.js";
import { createError } from "../error.js";

const escapeRegExp = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toExactIRegex = (str) => new RegExp(`^${escapeRegExp(str)}$`, "i");

export const addProducts = async (req, res, next) => {
  try {
    const productsData = req.body;

    if (!Array.isArray(productsData)) {
      return next(
        createError(400, "Invalid request. Expected an array of products")
      );
    }

    const createdproducts = [];

    for (const productInfo of productsData) {
      const { title, name, desc, img, price, sizes, category } = productInfo;

      const product = new Products({
        title,
        name,
        desc,
        img,
        price,
        sizes,
        category,
      });
      const createdproduct = await product.save();

      createdproducts.push(createdproduct);
    }

    return res
      .status(201)
      .json({ message: "Products added successfully", createdproducts });
  } catch (err) {
    next(err);
  }
};

export const getproducts = async (req, res, next) => {
  try {
    let { categories, minPrice, maxPrice, sizes, search } = req.query;
    sizes = sizes
      ? String(sizes)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;
    categories = categories
      ? String(categories)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    const filter = {};

    if (Array.isArray(categories) && categories.length > 0) {
      // Case-insensitive exact match against any category in the array field.
      filter.category = { $in: categories.map(toExactIRegex) };
    }

    if (minPrice || maxPrice) {
      const min = minPrice != null ? Number.parseFloat(minPrice) : null;
      const max = maxPrice != null ? Number.parseFloat(maxPrice) : null;
      filter["price.org"] = {};
      if (Number.isFinite(min)) {
        filter["price.org"]["$gte"] = min;
      }
      if (Number.isFinite(max)) {
        filter["price.org"]["$lte"] = max;
      }
      if (Object.keys(filter["price.org"]).length === 0) {
        delete filter["price.org"];
      }
    }

    if (Array.isArray(sizes) && sizes.length > 0) {
      // Case-insensitive exact match against any size in the array field.
      filter.sizes = { $in: sizes.map(toExactIRegex) };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: new RegExp(search, "i") } }, // Case-insensitive title search
        { desc: { $regex: new RegExp(search, "i") } }, // Case-insensitive description search
      ];
    }

    const products = await Products.find(filter);
    return res.status(200).json(products);
  } catch (err) {
    next(err);
  }
};

export const getProductsMeta = async (req, res, next) => {
  try {
    const [categories, sizes] = await Promise.all([
      Products.distinct("category"),
      Products.distinct("sizes"),
    ]);

    // Best-effort max price for a nicer slider default.
    const maxPriceAgg = await Products.aggregate([
      { $group: { _id: null, max: { $max: "$price.org" } } },
    ]);
    const maxPrice = Number(maxPriceAgg?.[0]?.max || 0);

    return res.status(200).json({
      categories: (categories || []).filter(Boolean).sort(),
      sizes: (sizes || []).filter(Boolean).sort(),
      maxPrice,
    });
  } catch (err) {
    return next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next(createError(400, "Invalid product ID"));
    }
    const product = await Products.findById(id);
    if (!product) {
      return next(createError(404, "Product not found"));
    }
    return res.status(200).json(product);
  } catch (err) {
    return next(err);
  }
};
