/**
 * @typedef {Object} Input - The input parameters for listing Notion pages.
 * @property {string} notionToken - The Notion integration API token.
 * @property {string} [pageId] - Parent page ID to list children of. If omitted, lists all accessible pages.
 */
type Input = {
  notionToken: string;
  pageId?: string;
};

/**
 * @typedef {Object} Output - The output of listing Notion pages.
 * @property {object[]} pages - Array of page objects from Notion.
 * @property {string} [error] - Error message if the operation failed.
 */
type Output = {
  pages: object[];
  error?: string;
};

/**
 * Lists all pages accessible to the Notion integration, or child pages under a specific page.
 *
 * @param {Input} input - The Notion token and optional parent page ID.
 *
 * @returns {Promise<Output>} The list of pages.
 */
export default async function listNotionPages({
  notionToken,
  pageId,
}: Input): Promise<Output> {
  const response = await fetch("/server-function/notion/list-pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notionToken, pageId }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { pages: [], error: data.error };
  }

  return { pages: data.pages };
}
