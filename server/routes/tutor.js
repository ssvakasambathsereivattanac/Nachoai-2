const { Router } = require("express");
const rateLimit = require("express-rate-limit");

const storage = require("../services/storage");
const config = require("../config");
const { streamReply } = require("../services/ai");
const { processAttachments } = require("../services/attachments");

const router = Router();

router.use(
  rateLimit({
    windowMs: 60_000,
    limit: 20,
  })
);

function send(res, payload) {
  if (!res.writableEnded && !res.destroyed) {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}

function publicError(error) {
  const status = Number(
    error?.status ||
    error?.statusCode ||
    error?.response?.status ||
    0
  );

  const message = String(error?.message || "Unknown error");

  if (
    /^(The file |NachoAI couldn't|No readable text|Attachments must|".*" is not a supported)/i.test(
      message
    )
  ) {
    return message;
  }

  if (!config.groqApiKey) {
    return "GROQ_API_KEY is missing. Add it in Vercel → Settings → Environment Variables.";
  }

  if (status === 401) {
    return "Groq rejected the API key (401). Check GROQ_API_KEY in Vercel.";
  }

  if (status === 403) {
    return "Groq denied access (403). Check your Groq account and model permissions.";
  }

  if (status === 404) {
    return "Groq could not find the selected model (404). Check GROQ_MODEL or GROQ_VISION_MODEL.";
  }

  if (status === 413) {
    return "The upload is too large. Try a smaller PDF or fewer attachments.";
  }

  if (status === 429) {
    return "Groq's rate limit or usage quota was reached (429). Try again later.";
  }

  const safeMessage = message
    .replace(/gsk_[A-Za-z0-9_-]+/g, "[hidden]")
    .replace(/Bearer\s+\S+/gi, "Bearer [hidden]")
    .slice(0, 220);

  return `NachoAI couldn't process this request${status ? ` (${status})` : ""}: ${safeMessage}`;
}

router.post("/", async (req, res) => {
  const body = req.body || {};

  const chatId = body.chatId;

  const text =
    typeof body.message === "string"
      ? body.message.trim()
      : "";

  const language = ["en", "km", "fr"].includes(body.language)
    ? body.language
    : "en";

  const grade = String(body.grade || "8");
  const subject = String(body.subject || "General");

  const attachments = Array.isArray(body.attachments)
    ? body.attachments
    : [];

  if (!text && attachments.length === 0) {
    return res.status(400).json({
      error: "Please enter a question or attach a file.",
    });
  }

  if (attachments.length > 3) {
    return res.status(400).json({
      error: "You can attach up to 3 files at a time.",
    });
  }

  if (!config.groqApiKey) {
    return res.status(503).json({
      error: publicError(new Error("Missing API key")),
    });
  }

  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.flushHeaders();

  try {
    // Extract attachments before creating a chat.
    const { texts, images } = await processAttachments(attachments);

    const documentGuidance = texts.length
      ? [
          "DOCUMENT-GROUNDED ANSWERING RULES:",
          "The student attached one or more documents. Treat the extracted document text below as the main source when answering questions about those documents.",
          "Explain the material at the selected grade level using simple language and examples.",
          "Do not invent facts, quotations, page numbers, or details that are not present in the extracted text.",
          "If the answer is not available in the extracted text, clearly say that the document does not provide enough information.",
          "The extraction may not preserve diagrams, page layout, or all table formatting; mention this limitation when it affects the answer.",
        ].join(" ")
      : "";

    const prompt = [
      text ||
        (texts.length
          ? "Please summarize this document and explain its key ideas for my grade."
          : "Please explain my attached image."),
      documentGuidance,
      ...texts,
    ]
      .filter(Boolean)
      .join("\n\n");

    const chat =
      (chatId && (await storage.getChat(chatId))) ||
      (await storage.createChat(language));

    const history = (
      Array.isArray(chat.messages) ? chat.messages : []
    )
      .slice(-12)
      .map(({ role, content }) => ({
        role,
        content,
      }));

    let reply = "";

    // Ask Groq and stream the answer to the student.
    for await (const delta of streamReply({
      history,
      message: prompt,
      images,
      options: {
        grade,
        subject,
        language,
      },
    })) {
      if (typeof delta !== "string" || !delta) {
        continue;
      }

      reply += delta;

      send(res, {
        type: "delta",
        text: delta,
      });
    }

    if (!reply.trim()) {
      throw new Error(
        "The AI returned an empty answer. Please try again."
      );
    }

    // Save the extracted document content for follow-up questions.
    const title =
      text ||
      attachments
        .map((file) => file.name)
        .filter(Boolean)
        .join(", ");

    await storage.appendMessages(
      chat.id,
      [
        {
          role: "user",
          content: prompt,
        },
        {
          role: "assistant",
          content: reply,
        },
      ],
      title
    );

    send(res, {
      type: "done",
      chatId: chat.id,
    });

  } catch (error) {
    console.error("[NachoAI tutor error]", {
      status: error?.status,
      code: error?.code,
      message: error?.message,
    });

    send(res, {
      type: "error",
      error: publicError(error),
    });

  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});

module.exports = router;
