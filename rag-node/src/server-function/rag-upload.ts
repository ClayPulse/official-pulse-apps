import { Pinecone } from "@pinecone-database/pinecone";
import { createHash } from "crypto";
import mammoth from "mammoth";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

/**
 * Splits text into chunks with overlap.
 */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    if (end >= text.length) break;
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

/**
 * Removes lone surrogates and other invalid Unicode characters that break JSON serialization.
 */
function sanitizeText(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\uD800-\uDFFF]|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

/**
 * Extracts plain text from a file buffer based on file extension.
 */
async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Plain text formats: .txt, .md, .csv, .json, .log, .xml, .html, .yml, etc.
  return buffer.toString("utf-8");
}

/**
 * Server function that uploads a document to a Pinecone vector index.
 * Accepts base64-encoded file content, parses it (supports .docx and plain text),
 * chunks the text, and upserts each chunk.
 * Accessible at /server-function/rag-upload (POST)
 */
export default async function ragUpload(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { fileBase64, fileName, indexName, namespace } = await req.json();

  if (!fileBase64) {
    return new Response(
      JSON.stringify({ error: "Missing required field: fileBase64" }),
      { status: 400 },
    );
  }

  if (!fileName) {
    return new Response(
      JSON.stringify({ error: "Missing required field: fileName" }),
      { status: 400 },
    );
  }

  if (!indexName) {
    return new Response(
      JSON.stringify({ error: "Missing required field: indexName" }),
      { status: 400 },
    );
  }

  const buffer = Buffer.from(fileBase64, "base64");
  const text = sanitizeText(await extractText(buffer, fileName));

  if (!text.trim()) {
    return new Response(
      JSON.stringify({ error: "No text content could be extracted from the file" }),
      { status: 400 },
    );
  }

  // Chunk the text
  const chunks = chunkText(text);

  // Upsert each chunk to Pinecone
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pc.index(indexName);
  const ns = namespace ? index.namespace(namespace) : index;

  const records = chunks.map((chunk, i) => ({
    _id: createHash("sha256").update(chunk).digest("hex"),
    text: chunk,
    chunkIndex: i,
  }));

  // Batch upsert in groups of 100
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await ns.upsertRecords({ records: batch });
  }

  return new Response(
    JSON.stringify({ upsertedCount: records.length }),
    { status: 200 },
  );
}
