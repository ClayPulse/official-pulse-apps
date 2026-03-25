/**
 * Server function for Gmail connection status.
 * GET    /server-function/gmail-status → returns connection status
 * DELETE /server-function/gmail-status → disconnects Gmail
 */
import { gmailTokenStore } from "./gmail-auth";

export default async function gmailStatus(req: Request) {
  if (req.method === "GET") {
    const connected = !!gmailTokenStore.access_token;
    return new Response(
      JSON.stringify({
        connected,
        email: connected ? gmailTokenStore.email : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (req.method === "DELETE") {
    gmailTokenStore.access_token = undefined;
    gmailTokenStore.refresh_token = undefined;
    gmailTokenStore.expires_at = undefined;
    gmailTokenStore.email = undefined;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
