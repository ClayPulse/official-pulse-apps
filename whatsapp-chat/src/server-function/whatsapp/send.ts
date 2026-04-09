/**
 * Send a WhatsApp message via the Cloud API.
 * POST /server-function/whatsapp/send
 * Body: { accessToken, phoneNumberId, to, message }
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { to, message } = await req.json();

  const session = JSON.parse(process.env.SESSION || "{}");
  const accessToken = session.accessToken;
  const phoneNumberId = session.phoneNumberId;

  if (!accessToken || !phoneNumberId) {
    return new Response(
      JSON.stringify({ error: "Not authenticated. Please sign in via the WhatsApp Chat app first." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!to || !message) {
    return new Response(
      JSON.stringify({ error: "to and message are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: message },
        }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || "Failed to send message", details: data }),
        { status: res.status, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Failed to send message: ${err}` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
