/**
 * Server function for Gmail OAuth callback.
 * GET /server-function/gmail-callback → handles Google OAuth redirect
 *
 * This endpoint receives the authorization code from Google and
 * posts it back to the parent window via postMessage.
 */
export default async function gmailCallback(req: Request) {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // Return an HTML page that sends the code to the opener window
  const html = `<!DOCTYPE html>
<html>
<head><title>Gmail Authorization</title></head>
<body>
<p>${error ? "Authorization failed: " + error : "Connecting Gmail..."}</p>
<script>
  ${
    code
      ? `window.opener?.postMessage({ type: "gmail-oauth-callback", code: "${code}" }, "*");`
      : ""
  }
  ${error ? `window.opener?.postMessage({ type: "gmail-oauth-error", error: "${error}" }, "*");` : ""}
  setTimeout(() => window.close(), 1500);
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
