import express from "express";
import { body } from "express-validator";
import { createSubscription, deleteSubscription, listSubscriptions } from "../controllers/alertController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

const subscriptionValidation = [
  body("contactType").isIn(["phone", "upiId"]).withMessage("Alerts support phone or UPI ID"),
  body("contactValue").trim().notEmpty().withMessage("Contact value is required").isLength({ max: 160 }),
  body("channel").isIn(["email", "sms"]).withMessage("Choose email or SMS alerts"),
  body("destination").trim().notEmpty().withMessage("Alert destination is required").isLength({ max: 160 }),
  body("frequency").optional().isIn(["instant", "daily"]).withMessage("Choose instant or daily alerts"),
  body("statusFilters").optional().isArray({ min: 1 }).withMessage("Choose at least one report status"),
  body("statusFilters.*").optional().isIn(["Pending Review", "Verified", "Under Investigation"]).withMessage("Invalid report status filter"),
];

router.use(protect);
router.get("/", listSubscriptions);
router.post("/", subscriptionValidation, validate, createSubscription);
router.delete("/:id", deleteSubscription);

export default router;
