/**
 * Server function to send an email.
 * Accessible at /server-function/send-email (POST)
 *
 * In BYOK mode, calls the Resend API directly with the user-provided key.
 * In managed mode, proxies to the configured backend.
 */
export default async function sendEmail(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { apiKey, from, to, subject, html, text } = await req.json();

  if (!to || !subject) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: to, subject" }),
      { status: 400 },
    );
  }

  // BYOK mode: call Resend API directly
  if (apiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from || "onboarding@resend.dev",
        to: Array.isArray(to) ? to : [to],
        subject,
        ...(html ? { html } : { text: text || "" }),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: response.status,
      });
    }
    return new Response(JSON.stringify(data), { status: 200 });
  }

  // Managed mode: call Pulse Editor backend (enforces domain ownership)
  const backendUrl = process.env.BACKEND_URL;
  const pulseApiKey = process.env.PULSE_API_KEY;
  if (!backendUrl || !pulseApiKey) {
    return new Response(
      JSON.stringify({ error: "Managed service not configured" }),
      { status: 500 },
    );
  }
  const response = await fetch(`${backendUrl}/api/email/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pulseApiKey}`,
    },
    body: JSON.stringify({
      from: from,
      to,
      subject,
      ...(html ? { html } : { text: text || "" }),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return new Response(JSON.stringify({ error: data.error || data }), {
      status: response.status,
    });
  }
  return new Response(JSON.stringify(data), { status: 200 });
}
