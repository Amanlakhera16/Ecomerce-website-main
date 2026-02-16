import express from "express";
import { submitContactMessage } from "../controllers/Contact.js";

const router = express.Router();

router.post("/", submitContactMessage);

export default router;

