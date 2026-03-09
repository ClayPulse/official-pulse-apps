import { Pinecone } from "@pinecone-database/pinecone";

/**
 * Server function that queries a Pinecone index with a natural language query.
 * Embeds the query via Pinecone Inference and returns top-k matching documents.
 * Accessible at /server-function/rag-query (POST)
 */
export default async function ragQuery(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { query, k, indexName, namespace } = await req.json();

  if (!query || !indexName || !k) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: query, indexName, k" }),
      { status: 400 },
    );
  }

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

  const embedding = await pc.inference.embed({
    model: "multilingual-e5-large",
    inputs: [query],
    parameters: { inputType: "query" },
  });

  const index = pc.index(indexName);
  const ns = namespace ? index.namespace(namespace) : index;

  const embeddingData = embedding.data?.[0];
  const values =
    embeddingData && "values" in embeddingData
      ? (embeddingData as { values: number[] }).values
      : [];

  const results = await ns.query({
    vector: values,
    topK: k,
    includeMetadata: true,
  });

  const documents = (results.matches || []).map((match) => ({
    id: match.id,
    score: match.score ?? 0,
    metadata: (match.metadata as Record<string, unknown>) ?? {},
    text:
      ((match.metadata as Record<string, unknown>)?.text as string) ??
      ((match.metadata as Record<string, unknown>)?.content as string) ??
      "",
  }));

  return new Response(JSON.stringify({ documents }), { status: 200 });
}
