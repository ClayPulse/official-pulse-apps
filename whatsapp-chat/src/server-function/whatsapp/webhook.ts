/**
 * WhatsApp webhook endpoint.
 * GET  /server-function/whatsapp/webhook — verification challenge
 * POST /server-function/whatsapp/webhook — incoming message notifications
 */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url, "http://localhost");

  // ── GET: Webhook verification ──────────────────────────────────────────
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "pulse_whatsapp_verify";

    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge || "", { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  // ── POST: Incoming webhook payload ─────────────────────────────────────
  if (req.method === "POST") {
    try {
      const body = await req.json();

      // Extract messages from the webhook payload
      const messages: Array<{
        from: string;
        timestamp: string;
        text: string;
        id: string;
        name?: string;
      }> = [];

      if (body.entry) {
        for (const entry of body.entry) {
          for (const change of entry.changes || []) {
            if (change.field !== "messages") continue;
            const value = change.value;
            const contacts = value?.contacts || [];
            for (const msg of value?.messages || []) {
              if (msg.type === "text") {
                const contact = contacts.find(
                  (c: { wa_id: string }) => c.wa_id === msg.from,
                );
                messages.push({
                  id: msg.id,
                  from: msg.from,
                  timestamp: msg.timestamp,
                  text: msg.text?.body || "",
                  name: contact?.profile?.name,
                });
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true, messages }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Webhook processing failed: ${err}` }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
