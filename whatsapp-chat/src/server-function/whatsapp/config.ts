/**
 * Return the public-safe Meta config needed by the frontend for Embedded Signup.
 * GET /server-function/whatsapp/config
 *
 * Only exposes META_APP_ID and FB_CONFIG_ID (not the secret).
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      metaAppId: process.env.META_APP_ID || "",
      fbConfigId: process.env.FB_CONFIG_ID || "",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
