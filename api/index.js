// Vercel serverless entry point. An Express app is itself a valid Node.js
// request handler ((req, res) => ...), so exporting it directly is enough -
// no extra wrapping needed. vercel.json routes every /api/* request here;
// everything else (public/*.html, css, js) is served as static files by
// Vercel's default static handling, same as server/app.js does for local
// dev with express.static.
module.exports = require("../server/app");
