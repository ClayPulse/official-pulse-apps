/**
 * @typedef {Object} Input - The input parameters for the RAG write action.
 * @property {string} text - The text content to embed and store.
 * @property {string} indexName - The name of the Pinecone index to write to.
 * @property {string} [namespace] - The namespace within the index (optional).
 */
type Input = {
  text: string;
  indexName: string;
  namespace?: string;
};

/**
 * @typedef {Object} Output - The output of the RAG write action.
 * @property {number} upsertedCount - The number of documents successfully upserted.
 */
type Output = {
  upsertedCount: number;
};

/**
 * Writes a document to a Pinecone vector index by calling the rag-write server function.
 *
 * @param {Input} input - The input parameters for the RAG write action.
 *
 * @returns {Promise<Output>} The count of upserted documents.
 */
export default async function ragWrite(input: Input): Promise<Output> {
  const response = await fetch("/server-function/rag-write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RAG write failed: ${error}`);
  }

  return response.json();
}
