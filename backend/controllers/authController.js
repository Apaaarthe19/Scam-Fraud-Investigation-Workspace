import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";

const refreshDurationMs = 30 * 24 * 60 * 60 * 1000;

const createRefreshToken = async (userId) => {
  const rawToken = crypto.randomBytes(48).toString("hex");
  await RefreshToken.create({
    tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
    user: userId,
    expiresAt: new Date(Date.now() + refreshDurationMs),
  });
  return rawToken;
};

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: refreshDurationMs,
    path: "/api/auth",
  });
};

const authResponse = async (res, user, status = 200) => {
  const refreshToken = await createRefreshToken(user._id);
  setRefreshCookie(res, refreshToken);
  res.status(status).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
};

// @desc Register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password });
    await authResponse(res, user, 201);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    await authResponse(res, user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const refreshAccessToken = async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  if (!rawToken) return res.status(401).json({ message: "Refresh token missing" });

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const storedToken = await RefreshToken.findOne({ tokenHash }).populate("user");
  if (!storedToken || storedToken.expiresAt <= new Date() || !storedToken.user) {
    return res.status(401).json({ message: "Refresh token expired" });
  }

  await storedToken.deleteOne();
  const nextRefreshToken = await createRefreshToken(storedToken.user._id);
  setRefreshCookie(res, nextRefreshToken);
  res.json({ token: generateToken(storedToken.user._id) });
};

export const logoutUser = async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  if (rawToken) {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await RefreshToken.deleteOne({ tokenHash });
  }
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth" });
  res.json({ message: "Logged out" });
};

// @desc Get current user profile
export const getProfile = async (req, res) => {
  res.json(req.user);
};
