/**
 * @typedef {Object} Input - The input parameters for the RAG query action.
 * @property {string} query - The natural language query to search for.
 * @property {number} k - The number of top results to return.
 * @property {string} indexName - The name of the Pinecone index to query.
 * @property {string} [namespace] - The namespace within the index (optional).
 */
type Input = {
  query: string;
  k: number;
  indexName: string;
  namespace?: string;
};

/**
 * @typedef {Object} Output - The output of the RAG query action.
 * @property {string[]} documents - The matched document texts sorted by relevance.
 */
type Output = {
  documents: string[];
};

/**
 * Queries a Pinecone index with a natural language query by calling the rag-query server function.
 *
 * @param {Input} input - The input parameters for the RAG query action.
 *
 * @returns {Promise<Output>} The matched documents from the vector search.
 */
export default async function ragQuery(input: Input): Promise<Output> {
  const response = await fetch("/server-function/rag-query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RAG query failed: ${error}`);
  }

  return response.json();
}
 