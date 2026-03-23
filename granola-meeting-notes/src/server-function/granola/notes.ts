const MCP_ENDPOINT = "https://mcp.granola.ai/mcp";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Disable TLS verification for local development (not recommended for production)

/**
 * Parses a JSON-RPC result from a response that may be SSE or plain JSON.
 */
async function parseMcpResponse(res: Response): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream")) {
    // Parse SSE stream — collect "data:" lines and find the JSON-RPC result
    const text = await res.text();
    const lines = text.split("\n");
    let lastData = "";
    for (const line of lines) {
      if (line.startsWith("data:")) {
        lastData = line.slice(5).trim();
      }
    }
    if (!lastData) {
      throw new Error("No data in SSE stream");
    }
    return JSON.parse(lastData);
  }
  return res.json();
}

/**
 * Calls the Granola MCP `list_meetings` tool.
 * Body: { accessToken, arguments?: { title?, date?, attendees? } }
 */
export default async function listMeetings(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { accessToken, arguments: args } = await req.json();
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Access token required" }), { status: 400 });
  }

  const mcpHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${accessToken}`,
  };

  // Initialize MCP session
  const initRes = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: mcpHeaders,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "granola-pulse-app", version: "0.0.1" } } }),
  });

  if (!initRes.ok) {
    const text = await initRes.text();
    return new Response(JSON.stringify({ error: `MCP init failed: ${initRes.status}`, detail: text }), { status: initRes.status });
  }

  await parseMcpResponse(initRes);
  const sessionId = initRes.headers.get("mcp-session-id");

  // Call list_meetings tool
  const toolRes = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: {
      ...mcpHeaders,
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "list_meetings", arguments: args || {} },
    }),
  });

  if (!toolRes.ok) {
    const text = await toolRes.text();
    return new Response(JSON.stringify({ error: `MCP call failed: ${toolRes.status}`, detail: text }), { status: toolRes.status });
  }

  const data = await parseMcpResponse(toolRes);
  return new Response(JSON.stringify(data), { status: 200 });
}
