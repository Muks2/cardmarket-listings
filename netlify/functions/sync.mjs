import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const KEY_RE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export const handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  const key = event.queryStringParameters?.key;
  if (!key || !KEY_RE.test(key)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", ...CORS },
      body: JSON.stringify({ error: "Invalid key — format: XXXX-XXXX" }),
    };
  }

  const store = getStore({ name: "mtg-wishlist", context });

  // ── GET ─────────────────────────────────────────────────────────────
  if (event.httpMethod === "GET") {
    try {
      const data = await store.get(key, { type: "text" });
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", ...CORS },
        body: data ?? "null",
      };
    } catch {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", ...CORS },
        body: "null",
      };
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────
  if (event.httpMethod === "POST") {
    const body = event.body || "";
    if (body.length > 4_000_000) {
      return {
        statusCode: 413,
        headers: { "Content-Type": "application/json", ...CORS },
        body: JSON.stringify({ error: "Payload too large (max 4 MB)" }),
      };
    }
    try {
      await store.set(key, body);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", ...CORS },
        body: JSON.stringify({ ok: true }),
      };
    } catch (e) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", ...CORS },
        body: JSON.stringify({ error: e.message }),
      };
    }
  }

  return { statusCode: 405, headers: CORS, body: "Method not allowed" };
};
