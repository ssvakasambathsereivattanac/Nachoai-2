const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const config = require("./config");

const app = express();

// Deployed behind a reverse proxy / load balancer (Render, Railway, Fly,
// nginx, ...) by default, so express needs this to read the real client IP
// (used by express-rate-limit) from X-Forwarded-For instead of the proxy's.
app.set("trust proxy", 1);

app.use(
  helmet({
    // Pages load images from Unsplash and inline handlers; keep CSP off until
    // those are removed, rather than shipping a policy that breaks the UI.
    contentSecurityPolicy: false,
  }),
);
app.use(express.json({ limit: "15mb" })); // attachments arrive as data URLs

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// A generous ceiling on the whole API, on top of the stricter limiter
// routes/tutor.js applies to the AI endpoint itself.
app.use("/api", rateLimit({ windowMs: 60_000, limit: 120 }));

app.use("/api/chats", require("./routes/chats"));
app.use("/api/tutor", require("./routes/tutor"));
app.use(
  express.static(config.publicDir, {
    maxAge: config.isProduction ? "1d" : 0,
  }),
);

app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

module.exports = app;
