import AlertSubscription from "../models/AlertSubscription.js";
import Report from "../models/Report.js";
import { notifyMatchingSubscriptions } from "../utils/alertService.js";

const activeStatuses = ["Pending Review", "Verified", "Under Investigation"];

export const listSubscriptions = async (req, res) => {
  const subscriptions = await AlertSubscription.find({ user: req.user._id })
    .select("contactType contactValue channel destination enabled createdAt")
    .sort({ createdAt: -1 });
  res.json(subscriptions);
};

export const createSubscription = async (req, res) => {
  const { contactType, contactValue, channel, destination } = req.body;
  const normalizedValue = contactValue.trim().toLowerCase();
  const normalizedDestination = destination.trim();

  if (channel === "email" && normalizedDestination !== req.user.email) {
    return res.status(400).json({ message: "Email alerts must use your account email" });
  }

  if (channel === "sms" && !/^\\+[1-9]\\d{7,14}$/.test(normalizedDestination)) {
    return res.status(400).json({ message: "SMS destination must use international format, for example +919876543210" });
  }

  try {
    const subscription = await AlertSubscription.create({
      user: req.user._id,
      contactType,
      contactValue: normalizedValue,
      channel,
      destination: normalizedDestination,
    });

    const activeReports = await Report.find({
      status: { $in: activeStatuses },
      [`scamContact.${contactType}`]: normalizedValue,
    }).select("title category status createdAt scamContact");

    await Promise.all(activeReports.map((report) => notifyMatchingSubscriptions(report)));

    res.status(201).json({ subscription, activeReportCount: activeReports.length });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "This alert is already subscribed" });
    throw error;
  }
};

export const deleteSubscription = async (req, res) => {
  const subscription = await AlertSubscription.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!subscription) return res.status(404).json({ message: "Alert subscription not found" });
  res.json({ message: "Alert subscription removed" });
};
