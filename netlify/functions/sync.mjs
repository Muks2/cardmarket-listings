import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Sync key format: 4 uppercase alphanumeric + "-" + 4 uppercase alphanumeric
// e.g. "ABCD-1234"
const KEY_RE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key || !KEY_RE.test(key)) {
    return new Response(
      JSON.stringify({ error: "Invalid key — format: XXXX-XXXX" }),
      { status: 400, headers: { "Content-Type": "application/json", ...CORS } }
    );
  }

  const store = getStore("mtg-wishlist");

  // ── GET: Daten laden ─────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const data = await store.get(key, { type: "text" });
      return new Response(data ?? "null", {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    } catch {
      return new Response("null", {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }
  }

  // ── POST: Daten speichern ────────────────────────────────────────
  if (req.method === "POST") {
    const body = await req.text();
    if (body.length > 4_000_000) {
      return new Response(
        JSON.stringify({ error: "Payload too large (max 4 MB)" }),
        { status: 413, headers: { "Content-Type": "application/json", ...CORS } }
      );
    }
    try {
      await store.set(key, body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: CORS });
}
