// Import the library's actual implementation directly, not pdf-parse's
// index.js: that file checks `!module.parent` to guess whether it's being
// run standalone, and serverless bundlers (Vercel, webpack, esbuild) often
// make that check come out true even when required normally - triggering
// its leftover debug code, which tries to read a test PDF that doesn't
// exist in the deployed bundle and crashes the whole function on cold
// start with an ENOENT, before any request is even handled.
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const { maxAttachmentChars } = require("../config");

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl || "");
  if (!match) return null;
  const [, mime = "text/plain", base64, body] = match;
  const buffer = base64
    ? Buffer.from(body, "base64")
    : Buffer.from(decodeURIComponent(body));
  return { mime, buffer };
}

/**
 * Split attachments into extracted text and images (kept as data URLs).
 */
async function processAttachments(attachments = []) {
  const texts = [];
  const images = [];

  for (const { name, data } of attachments) {
    const parsed = parseDataUrl(data);
    if (!parsed) continue;

    if (parsed.mime.startsWith("image/")) {
      images.push(data);
    } else if (parsed.mime === "application/pdf") {
      const { text } = await pdfParse(parsed.buffer);
      texts.push(`File "${name}":\n${text.slice(0, maxAttachmentChars)}`);
    } else {
      const text = parsed.buffer.toString("utf8");
      texts.push(`File "${name}":\n${text.slice(0, maxAttachmentChars)}`);
    }
  }

  return { texts, images };
}

module.exports = { processAttachments };
