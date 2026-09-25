import express from "express";
import { body } from "express-validator";
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  upvoteReport,
  deleteReport,
  getStats,
  lookupContact,
  exportAuditTrail,
} from "../controllers/reportController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { reportLimiter } from "../middleware/rateLimiter.js";
import upload from "../middleware/upload.js";

const router = express.Router();

const reportValidation = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 150 }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 10 }).withMessage("Description too short"),
  body("amountLost").optional().isFloat({ min: 0 }).withMessage("Amount lost must be a positive number"),
];

router.get("/lookup", lookupContact); // public safety-check endpoint
router.get("/stats", getStats);

router
  .route("/")
  .get(getReports)
  .post(protect, reportLimiter, upload.array("evidence", 5), reportValidation, validate, createReport);

router.get("/:id/audit-export", protect, adminOnly, exportAuditTrail);
router.route("/:id").get(getReportById).delete(protect, deleteReport);
router.put("/:id/status", protect, adminOnly, updateReportStatus);
router.put("/:id/upvote", protect, upvoteReport);

export default router;
