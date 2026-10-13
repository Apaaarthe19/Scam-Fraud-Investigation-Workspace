import ThreatSignal from "../models/ThreatSignal.js";
import { normalizeIndicator, scoreThreatSignal } from "../utils/normalizeIndicator.js";

const allowedTypes = ["phone", "email", "website", "upiId", "message", "domain"];

export const ingestThreatSignals = async (req, res) => {
  const incoming = Array.isArray(req.body) ? req.body : req.body.signals;
  if (!Array.isArray(incoming) || incoming.length === 0 || incoming.length > 500) {
    return res.status(400).json({ message: "Send between 1 and 500 threat signals" });
  }

  const results = { created: 0, updated: 0, rejected: 0 };
  for (const signal of incoming) {
    if (!signal?.type || !allowedTypes.includes(signal.type) || !String(signal.value || "").trim()) {
      results.rejected += 1;
      continue;
    }
    const normalizedValue = normalizeIndicator(signal.type, signal.value);
    const update = {
      source: String(signal.source || "external-feed").trim(),
      sourceId: signal.sourceId ? String(signal.sourceId) : undefined,
      type: signal.type,
      value: String(signal.value).trim(),
      normalizedValue,
      title: signal.title || undefined,
      description: signal.description || "",
      confidence: Math.max(0, Math.min(100, Number(signal.confidence) || 50)),
      riskScore: scoreThreatSignal(signal),
      lastSeen: signal.lastSeen || new Date(),
      metadata: signal.metadata || {},
    };
    const filter = update.sourceId
      ? { source: update.source, sourceId: update.sourceId }
      : { source: update.source, normalizedValue: update.normalizedValue };
    const existing = await ThreatSignal.exists(filter);
    if (existing) {
      await ThreatSignal.updateOne(filter, { $set: update });
      results.updated += 1;
    } else {
      await ThreatSignal.create({ ...update, firstSeen: signal.firstSeen || new Date() });
      results.created += 1;
    }
  }
  res.status(202).json({ message: "Threat signals accepted for review", ...results });
};

export const getThreatFeed = async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const signals = await ThreatSignal.find({ status: "Published" }).sort({ lastSeen: -1 }).limit(limit).select("source type value title riskScore confidence lastSeen");
  res.json({ signals, generatedAt: new Date().toISOString() });
};

export const lookupThreatSignals = async (req, res) => {
  const value = String(req.query.value || "").trim();
  if (!value) return res.status(400).json({ message: "Provide a value to check" });
  const normalizedValues = ["phone", "email", "website", "upiId", "domain", "message"].map((type) => normalizeIndicator(type, value));
  const signals = await ThreatSignal.find({ status: "Published", normalizedValue: { $in: normalizedValues } }).sort({ lastSeen: -1 }).limit(50).select("source type value title description riskScore confidence lastSeen");
  res.json({ signals });
};

export const updateThreatStatus = async (req, res) => {
  const allowedStatuses = ["Pending Review", "Published", "Rejected"];
  if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ message: "Invalid threat status" });
  const signal = await ThreatSignal.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!signal) return res.status(404).json({ message: "Threat signal not found" });
  res.json(signal);
};

export const getThreatReviewQueue = async (req, res) => {
  const status = ["Pending Review", "Published", "Rejected"].includes(req.query.status)
    ? req.query.status
    : "Pending Review";
  const signals = await ThreatSignal.find({ status }).sort({ lastSeen: -1 }).limit(200);
  res.json({ signals });
};