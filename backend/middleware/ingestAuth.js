export const ingestAuth = (req, res, next) => {
  const configuredKey = process.env.THREAT_INGESTION_KEY;
  const providedKey = req.headers["x-ingestion-key"];
  if (!configuredKey || !providedKey || providedKey !== configuredKey) {
    return res.status(401).json({ message: "Valid threat ingestion key required" });
  }
  next();
};