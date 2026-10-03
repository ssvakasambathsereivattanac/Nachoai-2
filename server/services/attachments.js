const pdfParse = require("pdf-parse");
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
