import nodemailer from "nodemailer";
import AlertSubscription from "../models/AlertSubscription.js";

const activeStatuses = ["Pending Review", "Verified", "Under Investigation"];

const getEmailTransport = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
};

const sendEmail = async (subscription, report) => {
  const transporter = getEmailTransport();
  if (!transporter) return false;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: subscription.destination,
    subject: `New scam alert for ${subscription.contactValue}`,
    text: [
      `A new active scam report matches ${subscription.contactValue}.`,
      "",
      `Title: ${report.title}`,
      `Category: ${report.category}`,
      `Status: ${report.status}`,
      `Reported on: ${new Date(report.createdAt).toLocaleString()}`,
      "",
      "Review the report in your Scam & Fraud Investigation Workspace.",
    ].join("\\n"),
  });
  return true;
};

const sendSms = async (subscription, report) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    return false;
  }

  const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const body = new URLSearchParams({
    To: subscription.destination,
    From: process.env.TWILIO_FROM_NUMBER,
    Body: `Scam alert: ${report.title} matches ${subscription.contactValue}. Status: ${report.status}.`,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" }, body },
  );

  if (!response.ok) throw new Error(`Twilio returned ${response.status}`);
  return true;
};

export const notifyMatchingSubscriptions = async (report) => {
  if (!activeStatuses.includes(report.status)) return;

  const matches = Object.entries(report.scamContact || {})
    .filter(([contactType, value]) => ["phone", "upiId"].includes(contactType) && value?.trim())
    .map(([contactType, value]) => ({ contactType, contactValue: value.trim() }));

  if (!matches.length) return;

  const subscriptions = await AlertSubscription.find({
    enabled: true,
    $or: matches,
  });

  await Promise.all(subscriptions.map(async (subscription) => {
    if (subscription.notifiedReports.some((id) => id.equals(report._id))) return;

    try {
      const sent = subscription.channel === "email"
        ? await sendEmail(subscription, report)
        : await sendSms(subscription, report);
      if (sent) {
        await AlertSubscription.updateOne(
          { _id: subscription._id },
          { $addToSet: { notifiedReports: report._id } },
        );
      }
    } catch (error) {
      console.error(`Alert delivery failed for ${subscription.channel}: ${error.message}`);
    }
  }));
};
