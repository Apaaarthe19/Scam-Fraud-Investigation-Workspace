import express from "express";
import { body } from "express-validator";
import { registerUser, loginUser, getProfile } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  registerUser
);

router.post(
  "/login",
  authLimiter,
  [body("email").isEmail().withMessage("Valid email required"), body("password").notEmpty()],
  validate,
  loginUser
);

router.get("/profile", protect, getProfile);

export default router;
