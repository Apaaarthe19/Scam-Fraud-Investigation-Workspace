export const normalizeIndicator = (type, value) => {
  const input = String(value || "").trim();
  if (["phone", "upiId", "email", "website", "domain"].includes(type)) {
    return input.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
  return input.toLowerCase().replace(/\s+/g, " ");
};

export const scoreThreatSignal = ({ type, value, confidence = 50, riskScore }) => {
  if (Number.isFinite(Number(riskScore))) return Math.max(0, Math.min(100, Number(riskScore)));
  let score = Number(confidence) || 50;
  if (["phone", "email", "website", "domain", "upiId"].includes(type)) score += 10;
  if (/\b(otp|pin|password|urgent|payment|transfer|prize|blocked)\b/i.test(value)) score += 20;
  return Math.min(score, 100);
};