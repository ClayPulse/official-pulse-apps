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
        type: string;
        id: string;
        name?: string;
        media?: { id: string; mime_type?: string; caption?: string; filename?: string };
        location?: { latitude: number; longitude: number; name?: string; address?: string };
        reaction?: { message_id: string; emoji: string };
        interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string; description?: string } };
      }> = [];

      if (body.entry) {
        for (const entry of body.entry) {
          for (const change of entry.changes || []) {
            if (change.field !== "messages") continue;
            const value = change.value;
            const contacts = value?.contacts || [];
            for (const msg of value?.messages || []) {
              const contact = contacts.find(
                (c: { wa_id: string }) => c.wa_id === msg.from,
              );
              const base = {
                id: msg.id,
                from: msg.from,
                timestamp: msg.timestamp,
                type: msg.type,
                name: contact?.profile?.name,
              };

              switch (msg.type) {
                case "text":
                  messages.push({ ...base, text: msg.text?.body || "" });
                  break;
                case "image":
                case "video":
                case "audio":
                case "document":
                case "sticker":
                  messages.push({
                    ...base,
                    text: msg[msg.type]?.caption || `[${msg.type}]`,
                    media: {
                      id: msg[msg.type]?.id,
                      mime_type: msg[msg.type]?.mime_type,
                      caption: msg[msg.type]?.caption,
                      filename: msg[msg.type]?.filename,
                    },
                  });
                  break;
                case "location":
                  messages.push({
                    ...base,
                    text: msg.location?.name || `[Location: ${msg.location?.latitude}, ${msg.location?.longitude}]`,
                    location: msg.location,
                  });
                  break;
                case "reaction":
                  messages.push({
                    ...base,
                    text: msg.reaction?.emoji || "",
                    reaction: msg.reaction,
                  });
                  break;
                case "interactive":
                  messages.push({
                    ...base,
                    text:
                      msg.interactive?.button_reply?.title ||
                      msg.interactive?.list_reply?.title ||
                      "[interactive]",
                    interactive: msg.interactive,
                  });
                  break;
                case "contacts":
                  messages.push({
                    ...base,
                    text: `[Contact: ${msg.contacts?.[0]?.name?.formatted_name || "Unknown"}]`,
                  });
                  break;
                default:
                  messages.push({ ...base, text: `[${msg.type || "unknown"}]` });
                  break;
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
