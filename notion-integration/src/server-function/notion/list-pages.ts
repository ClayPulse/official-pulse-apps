import { Client } from "@notionhq/client";

export default async function listPages(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const { pageId, notionToken } = (await req.json()) as {
      pageId?: string;
      notionToken: string;
    };

    if (!notionToken) {
      return new Response(
        JSON.stringify({ error: "notionToken is required" }),
        { status: 400 },
      );
    }

    const notion = new Client({ auth: notionToken });

    if (pageId) {
      // List child pages under a specific page
      const blocks = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      });

      const childPages = blocks.results.filter(
        (block: any) => block.type === "child_page",
      );

      return new Response(JSON.stringify({ pages: childPages }), {
        status: 200,
      });
    } else {
      // Search for all pages the integration has access to
      const response = await notion.search({
        filter: { property: "object", value: "page" },
        page_size: 100,
      });

      return new Response(JSON.stringify({ pages: response.results }), {
        status: 200,
      });
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to list pages" }),
      { status: 500 },
    );
  }
}
