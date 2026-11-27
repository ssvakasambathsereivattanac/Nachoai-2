
require("dotenv").config();

const fs = require("fs");
const os = require("os");
const path = require("path");

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

    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

    visionModel:
        process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",

    // Supabase authentication
    supabaseUrl: (
        process.env.SUPABASE_URL || ""
    ).replace(/\/+$/, ""),

    supabasePublishableKey:
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        "",

    publicDir: path.join(__dirname, "..", "public"),

    chatsFile: path.join(dataDir, "chats.json"),

    maxAttachmentChars: 20000,
};
