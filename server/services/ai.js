const Groq = require("groq-sdk");
const config = require("../config");

const LANGUAGES = { en: "English", km: "Khmer", fr: "French" };

let client;
function getClient() {
  if (!config.groqApiKey) {
    throw new Error("GROQ_API_KEY is not set. See .env.example.");
  }
  client ||= new Groq({ apiKey: config.groqApiKey });
  return client;
}

function systemPrompt({ grade, subject, language }) {
  return [
    "You are NachoAI, a friendly, patient tutor.",
    `The student is in Grade ${grade}. Subject: ${subject}.`,
    `Always reply in ${LANGUAGES[language] || "English"}.`,
    "Explain simply with short steps and examples suited to the grade level.",
    "Guide the student to understand rather than just giving final answers.",
  ].join(" ");
}

/**
 * Streams a tutor reply. Yields text chunks.
 * `history` is an array of {role, content}.
 */
async function* streamReply({ history, message, images, options }) {
  const content = images.length
    ? [
        { type: "text", text: message },
        ...images.map((url) => ({ type: "image_url", image_url: { url } })),
      ]
    : message;

  const stream = await getClient().chat.completions.create({
    model: images.length ? config.visionModel : config.model,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt(options) },
      ...history,
      { role: "user", content },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content;
    if (text) yield text;
  }
}

module.exports = { streamReply };
