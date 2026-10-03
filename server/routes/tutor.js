const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const storage = require("../services/storage");
const { streamReply } = require("../services/ai");
const { processAttachments } = require("../services/attachments");

const router = Router();

router.use(rateLimit({ windowMs: 60_000, limit: 20 }));

const send = (res, payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

router.post("/", async (req, res) => {
  const {
    chatId,
    message = "",
    language = "en",
    grade = "8",
    subject = "General",
    attachments = [],
  } = req.body || {};

  const text = String(message).trim();
  if (!text && !attachments.length) {
    return res.status(400).json({ error: "Message is required." });
  }

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  try {
    const chat =
      (chatId && (await storage.getChat(chatId))) ||
      (await storage.createChat(language));

    const { texts, images } = await processAttachments(attachments);
    const prompt = [text || "Please explain my attached file.", ...texts].join(
      "\n\n",
    );

    const history = chat.messages
      .slice(-20)
      .map(({ role, content }) => ({ role, content }));

    let reply = "";
    for await (const delta of streamReply({
      history,
      message: prompt,
      images,
      options: { grade, subject, language },
    })) {
      reply += delta;
      send(res, { type: "delta", text: delta });
    }

    await storage.appendMessages(
      chat.id,
      [
        { role: "user", content: text || prompt },
        { role: "assistant", content: reply },
      ],
      text,
    );
    send(res, { type: "done", chatId: chat.id });
  } catch (error) {
    console.error(error);
    send(res, { type: "error", error: "NachoAI could not respond." });
  } finally {
    res.end();
  }
});

module.exports = router;
