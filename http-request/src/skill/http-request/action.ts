/**
 * @typedef {Object} Input
 * @property {("GET"|"POST"|"PUT"|"PATCH"|"DELETE"|"HEAD"|"OPTIONS")} method - HTTP method to use.
 * @property {string} url - Fully-qualified URL to send the request to.
 * @property {Record<string, string | number | boolean>} [queryParams] - Optional query string parameters.
 * @property {Record<string, string>} [headers] - Optional request headers.
 * @property {any} [body] - Optional request body. Typically JSON for POST/PUT/PATCH.
 * @property {number} [timeoutMs] - Optional timeout in milliseconds.
 */
type Input = {
  method: string;
  url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryParams?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  timeoutMs?: number;
};

/**
 * @typedef {Object} Output
 * @property {number | null} status - HTTP status code from the response (or null on network error).
 * @property {string} statusText - HTTP status text from the response (or error message).
 * @property {Record<string, string>} headers - Response headers as a key-value map.
 * @property {any} [data] - Parsed response body when possible.
 * @property {string} [rawText] - Raw response text (for debugging / non-JSON responses).
 * @property {Object} requestSummary - Echo of the original request configuration (for traceability).
 * @property {string} requestSummary.method - HTTP method used.
 * @property {string} requestSummary.url - Final URL (including query string).
 * @property {Record<string, string | number | boolean> | undefined} requestSummary.queryParams - Query parameters sent.
 * @property {Record<string, string> | undefined} requestSummary.headers - Headers sent.
 * @property {any} requestSummary.body - Request body sent.
 */
type Output = {
  status: number | null;
  statusText: string;
  headers: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  rawText?: string;
  requestSummary: {
    method: string;
    url: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryParams?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any;
  };
};

/**
 * Perform an outbound HTTP request to an arbitrary URL via the server-function.
 *
 * @param {Input} input - The HTTP request configuration.
 * @returns {Promise<Output>} Response metadata and body.
 */
export default async function httpRequest(input: Input): Promise<Output> {
  const response = await fetch("/server-function/http-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorPayload = (await response.json()) as { statusText?: string };
      if (errorPayload?.statusText) {
        message = errorPayload.statusText;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as Output;
}
