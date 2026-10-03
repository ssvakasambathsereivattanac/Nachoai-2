const fs = require("fs/promises");
const crypto = require("crypto");
const { chatsFile } = require("../config");

// Serialise writes so concurrent requests cannot corrupt the file.
let queue = Promise.resolve();

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(chatsFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function mutate(fn) {
  const run = queue.then(async () => {
    const chats = await readAll();
    const result = await fn(chats);
    await fs.writeFile(chatsFile, JSON.stringify(chats, null, 2));
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

const newId = () => `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

const listChats = async () =>
  (await readAll()).map(({ id, title, language }) => ({ id, title, language }));

const getChat = async (id) => (await readAll()).find((c) => c.id === id);

const createChat = (language = "en") =>
  mutate((chats) => {
    const chat = { id: newId(), title: "New chat", language, messages: [] };
    chats.unshift(chat);
    return chat;
  });

const deleteChat = (id) =>
  mutate((chats) => {
    const index = chats.findIndex((c) => c.id === id);
    if (index === -1) return false;
    chats.splice(index, 1);
    return true;
  });

const appendMessages = (id, messages, title) =>
  mutate((chats) => {
    const chat = chats.find((c) => c.id === id);
    if (!chat) return null;
    chat.messages.push(...messages);
    if (title && chat.title === "New chat") chat.title = title.slice(0, 60);
    return chat;
  });

module.exports = {
  listChats,
  getChat,
  createChat,
  deleteChat,
  appendMessages,
};
