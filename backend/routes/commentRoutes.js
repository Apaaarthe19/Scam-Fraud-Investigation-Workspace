import express from "express";
import { addComment, getComments } from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

router.route("/").get(getComments).post(protect, addComment);

export default router;
