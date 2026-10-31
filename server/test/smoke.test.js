const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../app");

function request(server, method, path, body) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const data = body ? JSON.stringify(body) : null;

    const req = http.request(
      {
        host: "localhost",
        port,
        path,
        method,
        headers: data
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(data),
            }
          : {},
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let parsed = raw;
          try {
            parsed = JSON.parse(raw);
          } catch (_) {
            /* non-JSON response, e.g. static files */
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      },
    );

    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

test("API smoke test", async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());

  await t.test("health check responds ok", async () => {
    const res = await request(server, "GET", "/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });

  await t.test("unknown API route returns 404 JSON", async () => {
    const res = await request(server, "GET", "/api/does-not-exist");
    assert.equal(res.status, 404);
  });

  await t.test("home page is served", async () => {
    const res = await request(server, "GET", "/index.html");
    assert.equal(res.status, 200);
  });

  let chatId;

  await t.test("can create a chat", async () => {
    const res = await request(server, "POST", "/api/chats", { language: "en" });
    assert.equal(res.status, 201);
    assert.ok(res.body.id);
    chatId = res.body.id;
  });

  await t.test("created chat is listed", async () => {
    const res = await request(server, "GET", "/api/chats");
    assert.equal(res.status, 200);
    assert.ok(res.body.some((c) => c.id === chatId));
  });

  await t.test("created chat can be fetched", async () => {
    const res = await request(server, "GET", `/api/chats/${chatId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, chatId);
  });

  await t.test("created chat can be deleted", async () => {
    const res = await request(server, "DELETE", `/api/chats/${chatId}`);
    assert.equal(res.status, 204);
  });

  await t.test("deleted chat is gone", async () => {
    const res = await request(server, "GET", `/api/chats/${chatId}`);
    assert.equal(res.status, 404);
  });

  await t.test("tutor endpoint rejects an empty message", async () => {
    const res = await request(server, "POST", "/api/tutor", { message: "" });
    assert.equal(res.status, 400);
  });
});
