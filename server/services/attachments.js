// Attachment processing for NachoAI.
// PDF text is extracted on the server; image files are sent to the vision model.

const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const { maxAttachmentChars = 20000 } = require("../config");

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

const ALLOWED_TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "text/xml",
  "application/json",
  "application/xml",
]);

function parseDataUrl(dataUrl, fileName) {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/i.exec(dataUrl || "");

  if (!match) {
    throw new Error(
      `The file "${fileName}" could not be read. Please attach it again.`
    );
  }

  const mime = (match[1] || "application/octet-stream").toLowerCase();

  let buffer;

  try {
    buffer = match[2]
      ? Buffer.from(match[3], "base64")
      : Buffer.from(decodeURIComponent(match[3]), "utf8");
  } catch {
    throw new Error(`The file "${fileName}" has invalid encoded data.`);
  }

  if (!buffer.length) {
    throw new Error(`The file "${fileName}" is empty.`);
  }

  if (buffer.length > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `The file "${fileName}" is larger than 8 MB. Please use a smaller file.`
    );
  }

  return { mime, buffer };
}

function limitExtractedText(text, fileName) {
  const limit =
    Number(maxAttachmentChars) > 0
      ? Number(maxAttachmentChars)
      : 20000;

  const cleanText = String(text || "")
    .replace(/\u0000/g, "")
    .trim();

  if (cleanText.length <= limit) {
    return cleanText;
  }

  return (
    cleanText.slice(0, limit) +
    `\n\n[NachoAI note: text from "${fileName}" was shortened because the document is very long.]`
  );
}

async function extractPdf(parsed, fileName) {
  if (parsed.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error(
      `"${fileName}" does not appear to be a valid PDF file.`
    );
  }

  let result;

  try {
    result = await pdfParse(parsed.buffer);
  } catch (error) {
    console.error(
      `[NachoAI PDF extraction error: ${fileName}]`,
      error
    );

    throw new Error(
      `NachoAI couldn't read "${fileName}". The PDF may be damaged, password-protected, or unsupported.`
    );
  }

  const extractedText = String(result.text || "").trim();

  if (!extractedText) {
    throw new Error(
      `NachoAI couldn't find selectable text in "${fileName}". It may be a scanned PDF. Upload page screenshots/images instead, or use an OCR version of the PDF.`
    );
  }

  const pageCount = Number(result.numpages) || 0;
  const limitedText = limitExtractedText(extractedText, fileName);

  return [
    `DOCUMENT NAME: ${fileName}`,
    pageCount ? `PAGE COUNT: ${pageCount}` : "",
    "EXTRACTED DOCUMENT TEXT:",
    limitedText,
    "END OF DOCUMENT TEXT.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Extract readable text from PDFs and text files.
 * Keep images as data URLs for the vision-capable Groq model.
 */
async function processAttachments(attachments = []) {
  if (!Array.isArray(attachments)) {
    throw new Error("Attachments must be sent as a list of files.");
  }

  const texts = [];
  const images = [];

  for (const attachment of attachments) {
    const name = String(
      attachment?.name || "unnamed file"
    ).slice(0, 180);

    const parsed = parseDataUrl(attachment?.data, name);

    if (
      parsed.mime === "application/pdf" ||
      name.toLowerCase().endsWith(".pdf")
    ) {
      texts.push(await extractPdf(parsed, name));
      continue;
    }

    if (parsed.mime.startsWith("image/")) {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(parsed.mime)
      ) {
        throw new Error(
          `The image type for "${name}" isn't supported. Use PNG, JPG, or WEBP.`
        );
      }

      images.push(attachment.data);
      continue;
    }

    if (ALLOWED_TEXT_TYPES.has(parsed.mime)) {
      const text = limitExtractedText(
        parsed.buffer.toString("utf8"),
        name
      );

      if (!text) {
        throw new Error(`No readable text was found in "${name}".`);
      }

      texts.push(
        `DOCUMENT NAME: ${name}\nDOCUMENT TEXT:\n${text}\nEND OF DOCUMENT TEXT.`
      );

      continue;
    }

    throw new Error(
      `"${name}" is not a supported attachment. Upload a PDF, text file, or PNG/JPG/WEBP image.`
    );
  }

  return { texts, images };
}

module.exports = { processAttachments };
