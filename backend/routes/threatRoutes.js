import express from "express";
import { ingestThreatSignals, getThreatFeed, getThreatReviewQueue, lookupThreatSignals, updateThreatStatus } from "../controllers/threatController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { ingestAuth } from "../middleware/ingestAuth.js";
import { ingestionLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/feed", getThreatFeed);
router.get("/lookup", lookupThreatSignals);
router.post("/ingest", ingestionLimiter, ingestAuth, ingestThreatSignals);
router.get("/review", protect, adminOnly, getThreatReviewQueue);
router.put("/:id/status", protect, adminOnly, updateThreatStatus);

export default router;