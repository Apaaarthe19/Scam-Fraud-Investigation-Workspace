import mongoose from "mongoose";

const alertSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contactType: { type: String, enum: ["phone", "upiId"], required: true },
    contactValue: { type: String, required: true, trim: true },
    channel: { type: String, enum: ["email", "sms"], required: true },
    destination: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true },
    notifiedReports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report" }],
  },
  { timestamps: true },
);

alertSubscriptionSchema.index(
  { user: 1, contactType: 1, contactValue: 1, channel: 1, destination: 1 },
  { unique: true },
);

export default mongoose.model("AlertSubscription", alertSubscriptionSchema);
