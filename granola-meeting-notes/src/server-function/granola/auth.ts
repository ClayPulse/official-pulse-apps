const TOKEN_ENDPOINT = "https://mcp-auth.granola.ai/oauth2/token";
const REGISTER_ENDPOINT = "https://mcp-auth.granola.ai/oauth2/register";

/**
 * Handles OAuth token exchange and client registration for Granola MCP.
 * POST body: { action: "register" | "token", ... }
 */
export default async function auth(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.json();

  if (body.action === "register") {
    // Dynamic Client Registration
    const res = await fetch(REGISTER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "Granola Meeting Notes - Pulse App",
        redirect_uris: [body.redirectUri],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        scope: "openid email profile offline_access",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: `Registration failed: ${res.status}`, detail: text }),
        { status: res.status },
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200 });
  }

  if (body.action === "token") {
    // Exchange auth code for tokens
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: body.code,
      redirect_uri: body.redirectUri,
      client_id: body.clientId,
      code_verifier: body.codeVerifier,
    });

    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: `Token exchange failed: ${res.status}`, detail: text }),
        { status: res.status },
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200 });
  }

  if (body.action === "refresh") {
    // Refresh access token
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: body.refreshToken,
      client_id: body.clientId,
    });

    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: `Token refresh failed: ${res.status}`, detail: text }),
        { status: res.status },
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200 });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
