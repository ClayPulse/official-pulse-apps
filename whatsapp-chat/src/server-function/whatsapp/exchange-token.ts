/**
 * Exchange the Embedded Signup auth code for a System User Access Token,
 * then retrieve the shared WABA ID and phone number ID.
 *
 * POST /server-function/whatsapp/exchange-token
 * Body: { code }
 *
 * Requires env vars: META_APP_ID, META_APP_SECRET
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { code } = await req.json();

  if (!code) {
    return new Response(JSON.stringify({ error: "Code is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return new Response(
      JSON.stringify({ error: "META_APP_ID and META_APP_SECRET must be configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // Step 1: Exchange code for access token
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString(), { method: "GET" });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return new Response(
        JSON.stringify({ error: tokenData.error.message || "Token exchange failed" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const accessToken = tokenData.access_token;

    // Step 2: Get shared WABA(s) and phone number(s)
    // Use the debug_token endpoint to find the shared WABA
    const debugRes = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}`,
      { headers: { Authorization: `Bearer ${appId}|${appSecret}` } },
    );
    const debugData = await debugRes.json();

    const granularScopes = debugData.data?.granular_scopes || [];
    const wabaScope = granularScopes.find(
      (s: { scope: string }) =>
        s.scope === "whatsapp_business_management" || s.scope === "whatsapp_business_messaging",
    );
    const wabaId = wabaScope?.target_ids?.[0];

    // Step 3: If we have a WABA, get its phone numbers
    let phoneNumberId: string | null = null;
    let phoneDisplay: string | null = null;

    if (wabaId) {
      const phonesRes = await fetch(
        `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const phonesData = await phonesRes.json();

      if (phonesData.data?.length > 0) {
        phoneNumberId = phonesData.data[0].id;
        phoneDisplay = phonesData.data[0].display_phone_number;
      }

      // Step 4: Subscribe the app to the WABA for webhooks
      await fetch(
        `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        accessToken,
        wabaId: wabaId || null,
        phoneNumberId,
        phoneDisplay,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Token exchange failed: ${err}` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
