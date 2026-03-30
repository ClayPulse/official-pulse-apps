import { htmlToPdf } from "./html-to-pdf";

/**
 * Generates a PDF document from HTML content.
 * POST body: { "content": "<html string>" }
 * Returns: { "pdf": "base64 string" }
 */
export default async function generatePdf(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { content } = await req.json();

  if (!content || typeof content !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid 'content' field" }),
      { status: 400 },
    );
  }

  try {
    const pdfBytes = await htmlToPdf(content);
    const base64 = Buffer.from(pdfBytes).toString("base64");

    return new Response(JSON.stringify({ pdf: base64 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? "PDF generation failed" }),
      { status: 500 },
    );
  }
}
