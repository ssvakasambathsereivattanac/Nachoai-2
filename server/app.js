
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const config = require("./config");

const app = express();

app.set("trust proxy", 1);

app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

app.use(express.json({ limit: "15mb" }));

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// Public Supabase configuration.
// Only the project URL and publishable key are returned.
app.get("/api/auth-config", (req, res) => {
    if (
        !config.supabaseUrl ||
        !config.supabasePublishableKey
    ) {
        return res.status(503).json({
            error: "Supabase configuration is missing.",
        });
    }

    res.set("Cache-Control", "no-store");

    res.json({
        url: config.supabaseUrl,
        publishableKey: config.supabasePublishableKey,
    });
});

// API rate limit
app.use(
    "/api",
    rateLimit({
        windowMs: 60_000,
        limit: 120,
    })
);

// Keep existing chat routes working for now.
// We will protect them after the login frontend is connected.
app.use("/api/chats", require("./routes/chats"));
app.use("/api/tutor", require("./routes/tutor"));

// Serve website files
app.use(
    express.static(config.publicDir, {
        maxAge: config.isProduction ? "1d" : 0,
    })
);

// API 404
app.use("/api", (req, res) => {
    res.status(404).json({
        error: "Not found.",
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        error: "Internal server error.",
    });
});

module.exports = app;
