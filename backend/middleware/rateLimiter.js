import rateLimit from "express-rate-limit";

// Limits scam-report creation to prevent mass fake-reporting/abuse
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: "Too many reports submitted. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth routes to slow down brute force / spam signups
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Too many attempts. Please try again in a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
