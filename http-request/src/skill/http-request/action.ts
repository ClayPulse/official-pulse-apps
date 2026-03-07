import axios, { AxiosRequestConfig, Method } from "axios";

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
  method: Method;
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
 * Perform an outbound HTTP request to an arbitrary URL.
 *
 * This action supports:
 * - Configurable HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS).
 * - Optional query string parameters.
 * - Optional headers.
 * - Optional JSON/text body.
 * - Optional timeout.
 *
 * The function attempts to parse JSON responses, but always returns the raw
 * response text for maximum flexibility.
 *
 * @param {Input} input - The HTTP request configuration.
 * @returns {Promise<Output>} Response metadata and body.
 */
export default async function httpRequest(input: Input): Promise<Output> {
  const {
    method,
    url,
    queryParams,
    headers = {},
    body,
    timeoutMs,
  } = input;

  // Basic validation at runtime for safer usage from agents / UI.
  if (!url || typeof url !== "string") {
    return {
      status: null,
      statusText: "Invalid URL",
      headers: {},
      requestSummary: {
        method: method || "GET",
        url: url || "",
        queryParams,
        headers,
        body,
      },
    };
  }

  const normalizedMethod = (method || "GET").toUpperCase() as Method;

  const config: AxiosRequestConfig = {
    method: normalizedMethod,
    url,
    params: queryParams,
    headers,
    data: body,
    timeout: timeoutMs,
    // Keep response as text so we can attempt JSON parsing manually.
    responseType: "text",
    validateStatus: () => true, // We want to capture non-2xx as well.
  };

  try {
    const response = await axios<string>(config);

    const responseHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(response.headers || {})) {
      responseHeaders[key] = Array.isArray(value) ? value.join(", ") : String(value);
    }

    let parsedData: unknown = undefined;
    let rawText: string | undefined = response.data;

    if (typeof rawText === "string") {
      // Try to parse JSON, but don't fail if it's not JSON.
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        // Not JSON; leave parsedData as undefined and keep rawText.
      }
    } else {
      parsedData = response.data;
    }

    return {
      status: response.status ?? null,
      statusText: response.statusText,
      headers: responseHeaders,
      data: parsedData,
      rawText,
      requestSummary: {
        method: normalizedMethod,
        url: response.request?.res?.responseUrl ?? url,
        queryParams,
        headers,
        body,
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";

    return {
      status: null,
      statusText: message,
      headers: {},
      requestSummary: {
        method: normalizedMethod,
        url,
        queryParams,
        headers,
        body,
      },
    };
  }
}
