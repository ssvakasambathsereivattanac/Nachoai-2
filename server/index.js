const app = require("./app");
const config = require("./config");

const server = app.listen(config.port, () =>
  console.log(`NachoAI running at http://localhost:${config.port}`),
);

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
