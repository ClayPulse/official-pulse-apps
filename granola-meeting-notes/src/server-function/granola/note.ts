const MCP_ENDPOINT = "https://mcp.granola.ai/mcp";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Disable TLS verification for local development (not recommended for production)

/**
 * Parses a JSON-RPC result from a response that may be SSE or plain JSON.
 */
async function parseMcpResponse(res: Response): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream")) {
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
 * Calls the Granola MCP `get_meetings` or `get_meeting_transcript` tool.
 * Body: { accessToken, meetingId, includeTranscript? }
 */
export default async function getMeeting(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  console.log("Env" + JSON.stringify(process.env));

  const { meetingId, includeTranscript } = await req.json();
  const accessToken = process.env.OAUTH_GRANOLA_ACCESSTOKEN;
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: "Not authenticated with Granola" }),
      { status: 401 },
    );
  }
  if (!meetingId) {
    return new Response(JSON.stringify({ error: "meetingId required" }), {
      status: 400,
    });
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
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "granola-pulse-app", version: "0.0.1" },
      },
    }),
  });

  if (!initRes.ok) {
    const text = await initRes.text();
    return new Response(
      JSON.stringify({
        error: `MCP init failed: ${initRes.status}`,
        detail: text,
      }),
      { status: initRes.status },
    );
  }

  await parseMcpResponse(initRes);
  const sessionId = initRes.headers.get("mcp-session-id");
  const headers: Record<string, string> = {
    ...mcpHeaders,
    ...(sessionId ? { "mcp-session-id": sessionId } : {}),
  };

  // Get meeting notes
  const noteRes = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "get_meetings", arguments: { meeting_ids: [meetingId] } },
    }),
  });

  if (!noteRes.ok) {
    const text = await noteRes.text();
    return new Response(
      JSON.stringify({
        error: `MCP call failed: ${noteRes.status}`,
        detail: text,
      }),
      { status: noteRes.status },
    );
  }

  const noteData = await parseMcpResponse(noteRes);
  const result: Record<string, unknown> = { note: noteData };

  // Optionally get transcript
  if (includeTranscript) {
    const transcriptRes = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "get_meeting_transcript",
          arguments: { meeting_id: meetingId },
        },
      }),
    });

    if (transcriptRes.ok) {
      result.transcript = await parseMcpResponse(transcriptRes);
    }
  }

  return new Response(JSON.stringify(result), { status: 200 });
}
