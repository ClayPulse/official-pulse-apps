/**
 * Server function to send an email.
 * Accessible at /server-function/send-email (POST)
 *
 * Supports three modes:
 * - Gmail: sends via Gmail API using OAuth tokens
 * - BYOK: calls the Resend API directly with the user-provided key
 * - Managed: proxies to the configured Pulse Editor backend
 */
import { getValidAccessToken, gmailTokenStore } from "./gmail-auth";

export default async function sendEmail(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { apiKey, provider, from, to, subject, html, text } = await req.json();

  if (!to || !subject) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: to, subject" }),
      { status: 400 },
    );
  }

  // Gmail mode: send via Gmail API
  if (provider === "gmail") {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Gmail not connected. Please connect your Gmail account first." }),
        { status: 401 },
      );
    }

    const senderEmail = gmailTokenStore.email || "me";
    const fromHeader = from || senderEmail;

    // Build RFC 2822 email message
    const messageParts = [
      `From: ${fromHeader}`,
      `To: ${Array.isArray(to) ? to.join(", ") : to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: ${html ? "text/html" : "text/plain"}; charset=UTF-8`,
      "",
      html || text || "",
    ];
    const rawMessage = messageParts.join("\r\n");

    // Base64url encode
    const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encoded }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || "Failed to send via Gmail" }),
        { status: response.status },
      );
    }
    return new Response(JSON.stringify({ id: data.id }), { status: 200 });
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
