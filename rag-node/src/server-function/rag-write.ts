import { Pinecone } from "@pinecone-database/pinecone";
import { createHash } from "crypto";

/**
 * Server function that writes a document to a Pinecone vector index.
 * Uses upsertRecords which handles embedding automatically via the index's integrated model.
 * Accessible at /server-function/rag-write (POST)
 */
export default async function ragWrite(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { text, indexName, namespace } = await req.json();

  if (!text) {
    return new Response(
      JSON.stringify({ error: "Missing required field: text" }),
      { status: 400 },
    );
  }

  if (!indexName) {
    return new Response(
      JSON.stringify({ error: "Missing required field: indexName" }),
      { status: 400 },
    );
  }

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

  const index = pc.index(indexName);
  const ns = namespace ? index.namespace(namespace) : index;

  // eslint-disable-next-line no-control-regex
  const cleanText = text.replace(/[\uD800-\uDFFF]|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

  const record = {
    _id: createHash("sha256").update(cleanText).digest("hex"),
    text: cleanText,
  };

  await ns.upsertRecords({ records: [record] });

  return new Response(
    JSON.stringify({ upsertedCount: 1 }),
    { status: 200 },
  );
}
