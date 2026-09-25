import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import mongoSanitize from "express-mongo-sanitize";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

if (process.env.NODE_ENV === "production") {
	for (const key of ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"]) {
		if (!process.env[key] || process.env[key].includes("change_this")) {
			throw new Error(`${key} must be configured with a production value`);
		}
	}
}

connectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const configuredClientUrls = (process.env.CLIENT_URL || "http://localhost:5173")
	.split(",")
	.map((url) => url.trim())
	.filter(Boolean);
const isAllowedOrigin = (origin) => !origin
	|| configuredClientUrls.includes(origin)
	|| (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin))
	|| (process.env.NODE_ENV !== "production" && /^http:\/\/127\.0\.0\.1:\d+$/.test(origin));

app.use(helmet());
app.use(cors({
	origin: (origin, callback) => {
		if (isAllowedOrigin(origin)) return callback(null, true);
		return callback(new Error("Origin is not allowed by CORS"));
	},
}));
app.use(express.json({ limit: "100kb" }));
app.use(mongoSanitize()); // strips $ and . from user input -> prevents NoSQL injection

// Serve uploaded evidence files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => res.send("Scam & Fraud Investigation Workspace API is running"));

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reports/:reportId/comments", commentRoutes);
app.use("/api/alerts", alertRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
