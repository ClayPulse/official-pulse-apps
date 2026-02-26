import Anthropic from "@anthropic-ai/sdk";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractUrlsFromToolResult(content: any): string[] {
  if (!content) return [];
  const urls: string[] = [];

  // If it's a string, try JSON parse first, then regex
  if (typeof content === "string") {
    try {
      return extractUrlsFromToolResult(JSON.parse(content));
    } catch {
      const matches = content.match(/https?:\/\/[^\s"',>)]+/g) ?? [];
      return matches;
    }
  }

  // Array of result objects e.g. [{url, title, ...}, ...]
  if (Array.isArray(content)) {
    for (const item of content) {
      if (typeof item === "object" && item !== null) {
        if (item.url) urls.push(item.url);
        // Recurse into nested content arrays
        if (item.content) urls.push(...extractUrlsFromToolResult(item.content));
      }
    }
    return urls;
  }

  // Object with a results or content array
  if (typeof content === "object") {
    if (content.url) urls.push(content.url);
    if (content.results) urls.push(...extractUrlsFromToolResult(content.results));
    if (content.content) urls.push(...extractUrlsFromToolResult(content.content));
  }

  return urls;
}

export default async function webSearch(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { query } = await req.json();

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: "Query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        let sitesSearched = 0;
        let finalText = "";
        let currentBlockType = "";
        let currentBlockBuffer = "";
        const urls: string[] = [];

        const msgStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8096,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }] as any,
          messages: [
            {
              role: "user",
              content: `Search the web and provide a comprehensive, well-structured summary about: ${query.trim()}. Search multiple relevant sources and synthesize the information clearly.`,
            },
          ],
        });

        for await (const event of msgStream) {
          if (event.type === "content_block_start") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const block = event.content_block as any;
            const blockType = block.type as string;
            currentBlockType = blockType;
            currentBlockBuffer = "";
            
            if (blockType === "server_tool_use" || blockType === "tool_use") {
              sitesSearched++;
              send({ type: "progress", sitesSearched, urls });
            } else if (blockType === "web_search_tool_result") {
              // URLs are fully embedded in the content_block_start event
              const content = block.content;
              if (Array.isArray(content)) {
                for (const result of content) {
                  if (result?.url && !urls.includes(result.url)) {
                    urls.push(result.url);
                  }
                }
              }
              send({ type: "progress", sitesSearched, urls });
            }
          } else if (event.type === "content_block_delta") {
            if (
              event.delta.type === "text_delta" &&
              currentBlockType === "text"
            ) {
              finalText += event.delta.text;
            } else if (currentBlockType === "server_tool_result") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const d = event.delta as any;
              currentBlockBuffer += d.text ?? d.partial_json ?? "";
            }
          } else if (event.type === "content_block_stop") {
            currentBlockType = "";
            currentBlockBuffer = "";
          }
        }

        send({ type: "result", summary: finalText, urls });
      } catch (error) {
        send({ type: "error", message: String(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
