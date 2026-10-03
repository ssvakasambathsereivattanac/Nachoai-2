const { Router } = require("express");
const storage = require("../services/storage");

const router = Router();

router.get("/", async (req, res) => res.json(await storage.listChats()));

router.post("/", async (req, res) => {
  const chat = await storage.createChat(req.body?.language);
  res.status(201).json(chat);
});

router.get("/:id", async (req, res) => {
  const chat = await storage.getChat(req.params.id);
  if (!chat) return res.status(404).json({ error: "Chat not found." });
  res.json(chat);
});

router.delete("/:id", async (req, res) => {
  const removed = await storage.deleteChat(req.params.id);
  if (!removed) return res.status(404).json({ error: "Chat not found." });
  res.status(204).end();
});

module.exports = router;
