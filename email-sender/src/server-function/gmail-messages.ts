/**
 * Server function for reading Gmail messages.
 * POST /server-function/gmail-messages
 *
 * Actions:
 * - list: list messages (optional query, maxResults)
 * - get: get a single message by id
 */
import { getValidAccessToken } from "./gmail-auth";

export default async function gmailMessages(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return json({ error: "Gmail not connected" }, 401);
  }

  const { action, ...params } = await req.json();
  const headers = { Authorization: `Bearer ${accessToken}` };
  const base = "https://gmail.googleapis.com/gmail/v1/users/me";

  switch (action) {
    case "list": {
      const qs = new URLSearchParams();
      qs.set("maxResults", String(params.maxResults || 20));
      if (params.query) qs.set("q", params.query);
      if (params.pageToken) qs.set("pageToken", params.pageToken);
      if (params.labelIds) {
        for (const id of params.labelIds) qs.append("labelIds", id);
      }

      const res = await fetch(`${base}/messages?${qs}`, { headers });
      if (!res.ok) {
        const err = await res.json();
        return json({ error: err.error?.message || "Failed to list messages" }, res.status);
      }

      const listData = await res.json();
      const messageIds: { id: string; threadId: string }[] = listData.messages || [];

      // Fetch metadata for each message in parallel
      const messages = await Promise.all(
        messageIds.map(async (m) => {
          const msgRes = await fetch(
            `${base}/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers },
          );
          if (!msgRes.ok) return null;
          const msg = await msgRes.json();
          return parseMessageMetadata(msg);
        }),
      );

      return json({
        messages: messages.filter(Boolean),
        nextPageToken: listData.nextPageToken,
        resultSizeEstimate: listData.resultSizeEstimate,
      });
    }

    case "get": {
      if (!params.messageId) {
        return json({ error: "Missing messageId" }, 400);
      }

      const res = await fetch(
        `${base}/messages/${params.messageId}?format=full`,
        { headers },
      );
      if (!res.ok) {
        const err = await res.json();
        return json({ error: err.error?.message || "Failed to get message" }, res.status);
      }

      const msg = await res.json();
      return json(parseFullMessage(msg));
    }

    default:
      return json({ error: `Unknown action: ${action}` }, 400);
  }
}

function getHeader(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function parseMessageMetadata(msg: any) {
  const headers = msg.payload?.headers || [];
  return {
    id: msg.id,
    threadId: msg.threadId,
    snippet: msg.snippet,
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    subject: getHeader(headers, "Subject"),
    date: getHeader(headers, "Date"),
    labelIds: msg.labelIds || [],
    isUnread: (msg.labelIds || []).includes("UNREAD"),
  };
}

function parseFullMessage(msg: any) {
  const headers = msg.payload?.headers || [];
  const body = extractBody(msg.payload);

  return {
    id: msg.id,
    threadId: msg.threadId,
    snippet: msg.snippet,
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    subject: getHeader(headers, "Subject"),
    date: getHeader(headers, "Date"),
    labelIds: msg.labelIds || [],
    isUnread: (msg.labelIds || []).includes("UNREAD"),
    body,
  };
}

function extractBody(payload: any): { html: string; text: string } {
  let html = "";
  let text = "";

  if (!payload) return { html, text };

  // Single-part message
  if (payload.body?.data) {
    const decoded = base64UrlDecode(payload.body.data);
    if (payload.mimeType === "text/html") html = decoded;
    else text = decoded;
  }

  // Multipart message
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        html = base64UrlDecode(part.body.data);
      } else if (part.mimeType === "text/plain" && part.body?.data) {
        text = base64UrlDecode(part.body.data);
      } else if (part.parts) {
        // Nested multipart (e.g. multipart/alternative inside multipart/mixed)
        const nested = extractBody(part);
        if (nested.html) html = nested.html;
        if (nested.text) text = nested.text;
      }
    }
  }

  return { html, text };
}

function base64UrlDecode(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
