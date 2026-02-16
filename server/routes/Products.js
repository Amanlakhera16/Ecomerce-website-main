import express from "express";
import {
  addProducts,
  getProductsMeta,
  getProductById,
  getproducts,
} from "../controllers/Products.js";

const router = express.Router();

router.post("/add", addProducts);
router.get("/meta", getProductsMeta);
router.get("/", getproducts);
router.get("/:id", getProductById);

export default router;
