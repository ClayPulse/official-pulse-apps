import { Client } from "@notionhq/client";

export default async function writePage(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const { pageId, parentId, title, content, notionToken } =
      (await req.json()) as {
        pageId?: string;
        parentId?: string;
        title?: string;
        content: string;
        notionToken: string;
      };

    if (!notionToken) {
      return new Response(
        JSON.stringify({ error: "notionToken is required" }),
        { status: 400 },
      );
    }

    if (!pageId && !parentId) {
      return new Response(
        JSON.stringify({
          error: "Either pageId (to append) or parentId (to create new page) is required",
        }),
        { status: 400 },
      );
    }

    const notion = new Client({ auth: notionToken });

    // Parse content into Notion blocks
    const blocks = content.split("\n").filter(Boolean).map((line) => ({
      object: "block" as const,
      type: "paragraph" as const,
      paragraph: {
        rich_text: [{ type: "text" as const, text: { content: line } }],
      },
    }));

    if (pageId) {
      // Append content to existing page
      const result = await notion.blocks.children.append({
        block_id: pageId,
        children: blocks,
      });
      return new Response(
        JSON.stringify({ success: true, action: "appended", result }),
        { status: 200 },
      );
    } else {
      // Create new page under parent
      const result = await notion.pages.create({
        parent: { page_id: parentId! },
        properties: {
          title: {
            title: [{ text: { content: title || "Untitled" } }],
          },
        },
        children: blocks,
      });
      return new Response(
        JSON.stringify({ success: true, action: "created", result }),
        { status: 200 },
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to write page" }),
      { status: 500 },
    );
  }
}
