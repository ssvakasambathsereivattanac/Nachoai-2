require("dotenv").config();
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

module.exports = {
  port: Number(process.env.PORT) || 3000,
  isProduction: process.env.NODE_ENV === "production",
  groqApiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  visionModel:
    process.env.GROQ_VISION_MODEL ||
    "meta-llama/llama-4-scout-17b-16e-instruct",
  publicDir: path.join(__dirname, "..", "public"),
  chatsFile: path.join(dataDir, "chats.json"),
  maxAttachmentChars: 20000,
};
