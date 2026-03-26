/**
 * @typedef {Object} Input
 * @property {string} query - The search query input from UI.
 */
type Input = {
  query: string;
};

let _pendingResult: Output | null = null;

export function setPendingResult(result: Output) {
  _pendingResult = result;
}

/**
 * @typedef {Object} Source
 * @property {string} url - The URL of the source page.
 * @property {string} title - The title of the source page.
 * @property {string} [page_age] - When the site was last updated.
 */
type Source = {
  url: string;
  title: string;
  page_age?: string;
};

/**
 * @typedef {Object} Output
 * @property {string} summary - The summary of the search results.
 * @property {string[]} urls - The list of URLs from the search results.
 * @property {Source[]} sources - The list of sources with title and metadata.
 */
type Output = {
  summary: string;
  urls: string[];
  sources: Source[];
};

/**
 * Process the web search query from UI and return the search results. This action sends the search query to the server and processes the streaming response to extract the summary and URLs of the search results.
 * @param {Input} input - The input containing the search query from UI.
 * @returns {Promise<Output>} - The output containing the summary, URLs, sources, and citations from the search results.
 */
export default async function webSearch({ query }: Input): Promise<Output> {
  if (_pendingResult) {
    const result = _pendingResult;
    _pendingResult = null;
    return result;
  }

  const response = await fetch("/server-function/web-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: query.trim() }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let summary = "";
  let urls: string[] = [];
  let sources: Source[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(line.slice(6));
      } catch {
        continue; // skip malformed JSON
      }
      if (data.type === "result") {
        summary = (data.summary as string) ?? "";
        urls = (data.urls as string[]) ?? [];
        sources = (data.sources as Source[]) ?? [];
      } else if (data.type === "error") {
        throw new Error(data.message as string);
      }
    }
  }

  return { summary, urls, sources };
}
