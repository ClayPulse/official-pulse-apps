/**
 * @typedef {Object} Input - The input parameters for writing Notion content.
 * @property {string} notionToken - The Notion integration API token.
 * @property {string} content - The text content to write. Each line becomes a paragraph block.
 * @property {string} [pageId] - Existing page ID to append content to.
 * @property {string} [parentId] - Parent page ID to create a new child page under.
 * @property {string} [title] - Title for the new page (used with parentId).
 */
type Input = {
  notionToken: string;
  content: string;
  pageId?: string;
  parentId?: string;
  title?: string;
};

/**
 * @typedef {Object} Output - The output of writing Notion content.
 * @property {boolean} success - Whether the operation succeeded.
 * @property {string} action - "appended" or "created".
 * @property {object} result - The Notion API response.
 * @property {string} [error] - Error message if the operation failed.
 */
type Output = {
  success: boolean;
  action: string;
  result: object;
  error?: string;
};

/**
 * Writes content to a Notion page — either appending to an existing page or creating a new child page.
 *
 * @param {Input} input - The Notion token, content, and target page/parent info.
 *
 * @returns {Promise<Output>} The result of the write operation.
 */
export default async function writeNotionContent({
  notionToken,
  content,
  pageId,
  parentId,
  title,
}: Input): Promise<Output> {
  const response = await fetch("/server-function/notion/write-page", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notionToken, content, pageId, parentId, title }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, action: "", result: {}, error: data.error };
  }

  return { success: data.success, action: data.action, result: data.result };
}
