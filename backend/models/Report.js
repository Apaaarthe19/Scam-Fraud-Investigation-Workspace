import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Phishing",
        "UPI/Payment Fraud",
        "Job Scam",
        "Investment/Ponzi",
        "OTP/SIM Swap",
        "Fake Website/App",
        "Loan App Harassment",
        "Social Media Scam",
        "Other",
      ],
      default: "Other",
    },
    scamContact: {
      phone: { type: String },
      email: { type: String },
      website: { type: String },
      upiId: { type: String },
    },
    amountLost: { type: Number, default: 0 },
    severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    urgency: { type: String, enum: ["Routine", "Soon", "Immediate"], default: "Routine" },
    occurredAt: { type: Date },
    assignedDepartment: { type: String, trim: true, maxlength: 120, default: "" },
    evidenceUrls: [{ type: String }], // uploaded screenshots/proof
    location: {
      text: { type: String, trim: true },
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    status: {
      type: String,
      enum: ["Pending Review", "Verified", "Under Investigation", "Resolved", "Rejected"],
      default: "Pending Review",
    },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isAnonymous: { type: Boolean, default: false },
    adminNote: { type: String, default: "" },
    statusHistory: [{
      status: { type: String, enum: ["Pending Review", "Verified", "Under Investigation", "Resolved", "Rejected"], required: true },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      note: { type: String, default: "" },
      changedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

reportSchema.index({ title: "text", description: "text" });
reportSchema.index({ "location.lat": 1, "location.lng": 1, status: 1, category: 1 });

export default mongoose.model("Report", reportSchema);
