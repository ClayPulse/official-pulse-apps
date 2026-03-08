import axios, { AxiosRequestConfig, Method } from "axios";

export default async function httpRequestHandler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { method, url, queryParams, headers = {}, body, timeoutMs } =
      (await req.json()) as {
        method?: string;
        url?: string;
        queryParams?: Record<string, string | number | boolean>;
        headers?: Record<string, string>;
        body?: unknown;
        timeoutMs?: number;
      };

    if (!url || typeof url !== "string") {
      return Response.json(
        {
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
        },
        { status: 200 },
      );
    }

    const normalizedMethod = (method || "GET").toUpperCase() as Method;

    const config: AxiosRequestConfig = {
      method: normalizedMethod,
      url,
      params: queryParams,
      headers,
      data: body,
      timeout: timeoutMs,
      responseType: "text",
      validateStatus: () => true,
    };

    const response = await axios<string>(config);

    const responseHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(response.headers || {})) {
      responseHeaders[key] = Array.isArray(value)
        ? value.join(", ")
        : String(value);
    }

    let parsedData: unknown = undefined;
    const rawText: string | undefined = response.data;

    if (typeof rawText === "string") {
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        // Not JSON
      }
    } else {
      parsedData = response.data;
    }

    return Response.json({
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
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";

    return Response.json(
      {
        status: null,
        statusText: message,
        headers: {},
        requestSummary: {},
      },
      { status: 200 },
    );
  }
}
