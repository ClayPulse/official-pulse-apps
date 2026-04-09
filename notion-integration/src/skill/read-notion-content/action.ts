/**
 * @typedef {Object} Input - The input parameters for reading Notion content.
 * @property {string} pageId - The Notion page ID to read.
 * @property {string} notionToken - The Notion integration API token.
 */
type Input = {
  pageId: string;
  notionToken: string;
};

/**
 * @typedef {Object} Output - The output of reading Notion content.
 * @property {object} page - The page metadata from Notion.
 * @property {object[]} blocks - Array of block objects representing the page content.
 * @property {string} [error] - Error message if the operation failed.
 */
type Output = {
  page: object;
  blocks: object[];
  error?: string;
};

/**
 * Reads the content and metadata of a Notion page by its page ID.
 *
 * @param {Input} input - The page ID and Notion token.
 *
 * @returns {Promise<Output>} The page metadata and content blocks.
 */
export default async function readNotionContent({
  pageId,
  notionToken,
}: Input): Promise<Output> {
  const response = await fetch("/server-function/notion/read-page", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageId, notionToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { page: {}, blocks: [], error: data.error };
  }

  return { page: data.page, blocks: data.blocks };
}
