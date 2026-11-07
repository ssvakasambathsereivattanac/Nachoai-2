require("dotenv").config();
const fs = require("fs");
const os = require("os");
const path = require("path");

// Vercel (and most serverless platforms) only guarantee a writable /tmp,
// and it isn't shared or persistent across invocations - so chat history
// is best-effort there, not durable. Everywhere else, keep it next to the
// server code like before.
const isServerless = Boolean(process.env.VERCEL);
const dataDir = isServerless
  ? path.join(os.tmpdir(), "nachoai-data")
  : path.join(__dirname, "data");

fs.mkdirSync(dataDir, { recursive: true });

module.exports = {
  port: Number(process.env.PORT) || 3000,
  isProduction: process.env.NODE_ENV === "production",
  isServerless,
  groqApiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  visionModel:
    process.env.GROQ_VISION_MODEL ||
    "meta-llama/llama-4-scout-17b-16e-instruct",
  publicDir: path.join(__dirname, "..", "public"),
  chatsFile: path.join(dataDir, "chats.json"),
  maxAttachmentChars: 20000,
};
