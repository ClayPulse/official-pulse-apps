/**
 * @typedef {Object} Input - The input parameters for the RAG upload action.
 * @property {string} fileBase64 - The base64-encoded file content.
 * @property {string} fileName - The original file name (used to determine parsing strategy).
 * @property {string} indexName - The name of the Pinecone index to write to.
 * @property {string} [namespace] - The namespace within the index (optional).
 */
type Input = {
  fileBase64: string;
  fileName: string;
  indexName: string;
  namespace?: string;
};

/**
 * @typedef {Object} Output - The output of the RAG upload action.
 * @property {number} upsertedCount - The number of chunks successfully upserted.
 */
type Output = {
  upsertedCount: number;
};

/**
 * Uploads document text to a Pinecone vector index. The backend handles chunking and upserting.
 *
 * @param {Input} input - The input parameters for the RAG upload action.
 *
 * @returns {Promise<Output>} The count of upserted chunks.
 */
export default async function ragUpload(input: Input): Promise<Output> {
  const response = await fetch("/server-function/rag-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RAG upload failed: ${error}`);
  }

  return response.json();
}
