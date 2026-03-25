/**
 * Server function for Gmail OAuth authentication.
 * GET  /server-function/gmail-auth → returns the Google OAuth consent URL
 * POST /server-function/gmail-auth → exchanges authorization code for tokens
 */

// Simple in-memory token store (per server instance)
export const gmailTokenStore: {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  email?: string;
} = {};

export default async function gmailAuth(req: Request) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return new Response(
      JSON.stringify({
        error:
          "Gmail OAuth not configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REDIRECT_URI in .env",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (req.method === "GET") {
    // Return the OAuth consent URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
    });

    return new Response(
      JSON.stringify({
        url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (req.method === "POST") {
    const { code } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: "Missing authorization code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return new Response(
        JSON.stringify({ error: tokenData.error_description || tokenData.error }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Store tokens
    gmailTokenStore.access_token = tokenData.access_token;
    gmailTokenStore.refresh_token = tokenData.refresh_token;
    gmailTokenStore.expires_at = Date.now() + tokenData.expires_in * 1000;

    // Fetch user email
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    );
    if (userResponse.ok) {
      const userInfo = await userResponse.json();
      gmailTokenStore.email = userInfo.email;
    }

    return new Response(
      JSON.stringify({
        success: true,
        email: gmailTokenStore.email,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response("Method Not Allowed", { status: 405 });
}

/**
 * Get a valid access token, refreshing if needed.
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (!gmailTokenStore.access_token) return null;

  // Refresh if expired or about to expire (1 minute buffer)
  if (gmailTokenStore.expires_at && Date.now() > gmailTokenStore.expires_at - 60000) {
    if (!gmailTokenStore.refresh_token) return null;

    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: gmailTokenStore.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();
    if (!response.ok) return null;

    gmailTokenStore.access_token = data.access_token;
    gmailTokenStore.expires_at = Date.now() + data.expires_in * 1000;
  }

  return gmailTokenStore.access_token ?? null;
}
