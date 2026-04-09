import { Client } from "@notionhq/client";

export default async function readPage(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const { pageId, notionToken } = (await req.json()) as {
      pageId: string;
      notionToken: string;
    };

    if (!pageId || !notionToken) {
      return new Response(
        JSON.stringify({ error: "pageId and notionToken are required" }),
        { status: 400 },
      );
    }

    const notion = new Client({ auth: notionToken });

    // Get page metadata
    const page = await notion.pages.retrieve({ page_id: pageId });

    // Get page content (blocks)
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    return new Response(
      JSON.stringify({ page, blocks: blocks.results }),
      { status: 200 },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to read page" }),
      { status: 500 },
    );
  }
}
