const express = require("express");
const helmet = require("helmet");
const config = require("./config");

const app = express();

app.use(
  helmet({
    // Pages load images from Unsplash and inline handlers; keep CSP off until
    // those are removed, rather than shipping a policy that breaks the UI.
    contentSecurityPolicy: false,
  }),
);
app.use(express.json({ limit: "15mb" })); // attachments arrive as data URLs

app.use("/api/chats", require("./routes/chats"));
app.use("/api/tutor", require("./routes/tutor"));
app.use(express.static(config.publicDir));

app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(config.port, () =>
  console.log(`NachoAI running at http://localhost:${config.port}`),
);
