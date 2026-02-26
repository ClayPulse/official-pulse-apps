/**
 * @typedef {Object} Input
 * @property {string} query - The search query input from UI.
 */
type Input = {
  query: string;
};

/**
 * @typedef {Object} Output
 * @property {string} summary - The summary of the search results.
 * @property {string[]} urls - The list of URLs from the search results.
 */
type Output = {
  summary: string;
  urls: string[];
};

/**
 * Process the web search query from UI and return the search results. This action sends the search query to the server and processes the streaming response to extract the summary and URLs of the search results.
 * @param {Input} input - The input containing the search query from UI.
 * @returns {Promise<Output>} - The output containing the summary and URLs from the search results.
 */
export default async function webSearch({ query }: Input): Promise<Output> {
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === "result") {
          summary = data.summary;
          urls = data.urls ?? [];
        } else if (data.type === "error") {
          throw new Error(data.message);
        }
      } catch {
        // ignore malformed events
      }
    }
  }

  return { summary, urls };
}
