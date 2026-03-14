import Anthropic from "@anthropic-ai/sdk";

type Source = { url: string; title: string; page_age?: string };
type Citation = { url: string; title: string; cited_text: string };

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
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        let sitesSearched = 0;
        let finalText = "";
        let currentBlockType = "";
        const sources: Source[] = [];
        const citations: Citation[] = [];

        const msgStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8096,
          tools: [
            {
              type: "web_search_20260209",
              name: "web_search",
              max_uses: 15,
              // Disable dynamic filtering (internal code execution) for reliable streaming
              allowed_callers: ["direct"],
              user_location: {
                type: "approximate",
                city: "Toronto",
                region: "Ontario",
                country: "CA",
                timezone: "America/Toronto",
              },
            },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any,
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

            if (blockType === "text") {
              send({ type: "generating" });
            } else if (blockType === "server_tool_use" && block.name === "web_search") {
              sitesSearched++;
              send({
                type: "progress",
                sitesSearched,
                sources,
                urls: sources.map((s) => s.url),
              });
            } else if (blockType === "web_search_tool_result") {
              const content = block.content;
              // Handle error results (e.g. max_uses_exceeded, too_many_requests)
              if (
                content &&
                !Array.isArray(content) &&
                content.type === "web_search_tool_result_error"
              ) {
                send({
                  type: "search_error",
                  error_code: content.error_code,
                });
              } else if (Array.isArray(content)) {
                for (const result of content) {
                  if (
                    result?.type === "web_search_result" &&
                    result.url &&
                    !sources.some((s) => s.url === result.url)
                  ) {
                    sources.push({
                      url: result.url,
                      title: result.title || "",
                      page_age: result.page_age,
                    });
                  }
                }
              }
              send({
                type: "progress",
                sitesSearched,
                sources,
                urls: sources.map((s) => s.url),
              });
            }
          } else if (event.type === "content_block_delta") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const delta = event.delta as any;
            if (delta.type === "text_delta" && currentBlockType === "text") {
              finalText += delta.text;
              send({ type: "text_delta", text: delta.text });

              // Capture citations attached to text deltas
              if (Array.isArray(delta.citations)) {
                for (const citation of delta.citations) {
                  if (citation.type === "web_search_result_location") {
                    citations.push({
                      url: citation.url,
                      title: citation.title || "",
                      cited_text: citation.cited_text || "",
                    });
                  }
                }
              }
            }
          } else if (event.type === "content_block_stop") {
            currentBlockType = "";
          }
        }

        send({
          type: "result",
          summary: finalText,
          sources,
          citations,
          urls: sources.map((s) => s.url),
        });
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
      Connection: "keep-alive",
    },
  });
}
