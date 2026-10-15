import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";

const email = process.env.DEMO_ADMIN_EMAIL;
const password = process.env.DEMO_ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD must be set before seeding an admin");
}

try {
  await connectDB();
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    existingUser.name = "Demo Administrator";
    existingUser.role = "admin";
    existingUser.password = password;
    await existingUser.save();
  } else {
    await User.create({ name: "Demo Administrator", email, password, role: "admin" });
  }

  console.log(`Demo admin ready: ${email}`);
} finally {
  await mongoose.disconnect();
}