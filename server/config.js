require("dotenv").config();
const fs = require("fs");
const os = require("os");
const path = require("path");

// Vercel (both serverless functions and Container deployments appear to
// run on a read-only root filesystem outside of /tmp) only guarantees a
// writable /tmp, and it isn't persistent across container restarts/
// redeploys - so chat history is best-effort there, not durable.
// Everywhere else, keep it next to the server code like before.
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
  // llama-3.3-70b-versatile and the Llama 4 vision models were retired by
  // Groq during 2026; these are their currently active replacements per
  // https://console.groq.com/docs/deprecations and /docs/vision. Check
  // that page if either of these is ever retired too.
  model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  visionModel: process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b",
  publicDir: path.join(__dirname, "..", "public"),
  chatsFile: path.join(dataDir, "chats.json"),
  maxAttachmentChars: 20000,
};
