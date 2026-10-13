import mongoose from "mongoose";

const threatSignalSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, trim: true, maxlength: 120 },
    sourceId: { type: String, trim: true, maxlength: 200 },
    type: { type: String, enum: ["phone", "email", "website", "upiId", "message", "domain"], required: true },
    value: { type: String, required: true, trim: true, maxlength: 5000 },
    normalizedValue: { type: String, required: true, index: true },
    title: { type: String, trim: true, maxlength: 200, default: "External scam intelligence" },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    confidence: { type: Number, min: 0, max: 100, default: 50 },
    status: { type: String, enum: ["Pending Review", "Published", "Rejected"], default: "Pending Review", index: true },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

threatSignalSchema.index({ source: 1, sourceId: 1 }, { unique: true, sparse: true });
threatSignalSchema.index({ type: 1, normalizedValue: 1, status: 1 });

export default mongoose.model("ThreatSignal", threatSignalSchema);