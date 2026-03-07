import React, { useMemo, useState } from "react";
import { useActionEffect } from "@pulse-editor/react-api";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

type KeyValueRow = { id: string; key: string; value: string };

function createRow(): KeyValueRow {
  return {
    id: Math.random().toString(36).slice(2),
    key: "",
    value: "",
  };
}

function rowsToRecord(
  rows: KeyValueRow[],
): Record<string, string | number | boolean> | undefined {
  const result: Record<string, string | number | boolean> = {};
  for (const row of rows) {
    if (!row.key.trim()) continue;
    const trimmedKey = row.key.trim();
    const rawValue = row.value.trim();

    // Attempt to infer type: boolean, number, or fallback to string
    if (rawValue.toLowerCase() === "true") {
      result[trimmedKey] = true;
    } else if (rawValue.toLowerCase() === "false") {
      result[trimmedKey] = false;
    } else if (!Number.isNaN(Number(rawValue)) && rawValue !== "") {
      result[trimmedKey] = Number(rawValue);
    } else {
      result[trimmedKey] = rawValue;
    }
  }
  return Object.keys(result).length ? result : undefined;
}

function rowsToStringRecord(rows: KeyValueRow[]): Record<string, string> | undefined {
  const result: Record<string, string> = {};
  for (const row of rows) {
    if (!row.key.trim()) continue;
    result[row.key.trim()] = row.value;
  }
  return Object.keys(result).length ? result : undefined;
}

export default function HttpRequestNode() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("");
  const [timeoutMs, setTimeoutMs] = useState<string>("");

  const [queryRows, setQueryRows] = useState<KeyValueRow[]>([createRow()]);
  const [headerRows, setHeaderRows] = useState<KeyValueRow[]>([
    {
      id: Math.random().toString(36).slice(2),
      key: "Content-Type",
      value: "application/json",
    },
  ]);

  const [bodyText, setBodyText] = useState<string>("{\n  \n}");
  const [isSending, setIsSending] = useState(false);
  const [responseStatus, setResponseStatus] = useState<string>("");
  const [responsePreview, setResponsePreview] = useState<string>("");

  const methodClass = useMemo(() => {
    switch (method) {
      case "GET":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "POST":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "PUT":
      case "PATCH":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "DELETE":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  }, [method]);

  const { runAppAction } = useActionEffect(
    {
      actionName: "http-request",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeAction: async (args: any) => {
        setIsSending(true);
        setResponseStatus("Sending request...");
        setResponsePreview("");
        return args;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      afterAction: async (result: any) => {
        setIsSending(false);
        if (!result) {
          setResponseStatus("No response");
          return result;
        }

        const status = result.status ?? "Network error";
        const statusText = result.statusText ?? "";
        setResponseStatus(`${status} ${statusText}`);

        try {
          if (result.data !== undefined) {
            setResponsePreview(JSON.stringify(result.data, null, 2));
          } else if (typeof result.rawText === "string") {
            setResponsePreview(result.rawText);
          } else {
            setResponsePreview(JSON.stringify(result, null, 2));
          }
        } catch {
          setResponsePreview(JSON.stringify(result, null, 2));
        }

        return result;
      },
    },
    [],
  );

  function updateRow(
    type: "query" | "header",
    id: string,
    field: "key" | "value",
    value: string,
  ) {
    const setter = type === "query" ? setQueryRows : setHeaderRows;
    const current = type === "query" ? queryRows : headerRows;
    setter(
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function addRow(type: "query" | "header") {
    const setter = type === "query" ? setQueryRows : setHeaderRows;
    setter((rows) => [...rows, createRow()]);
  }

  function removeRow(type: "query" | "header", id: string) {
    const setter = type === "query" ? setQueryRows : setHeaderRows;
    setter((rows) => rows.filter((row) => row.id !== id));
  }

  function buildBody(): any {
    const trimmed = bodyText.trim();
    if (!trimmed) return undefined;

    // Try JSON first
    try {
      return JSON.parse(trimmed);
    } catch {
      // Fallback to raw string
      return bodyText;
    }
  }

  async function handleSend() {
    if (!runAppAction) return;
    if (!url.trim()) {
      setResponseStatus("Please enter a URL.");
      return;
    }

    const queryParams = rowsToRecord(queryRows);
    const headers = rowsToStringRecord(headerRows);
    const timeout =
      timeoutMs.trim() && !Number.isNaN(Number(timeoutMs))
        ? Number(timeoutMs)
        : undefined;

    const input = {
      method,
      url: url.trim(),
      queryParams,
      headers,
      body: ["GET", "HEAD"].includes(method) ? undefined : buildBody(),
      timeoutMs: timeout,
    };

    await runAppAction(input);
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${methodClass}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            HTTP Request
          </span>
          <span className="text-xs text-slate-400">
            Configure and send an outbound HTTP call
          </span>
        </div>
        <button
          onClick={handleSend}
          disabled={isSending}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md border border-sky-500/60 bg-sky-600/90 hover:bg-sky-500/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {isSending ? "Sending..." : "Send Request"}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        {/* Left: Request config */}
        <div className="border-r border-slate-900 flex flex-col overflow-hidden">
          {/* URL & method */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-900">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  className="text-xs font-semibold rounded-md border border-slate-700 bg-slate-900 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {HTTP_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/resource"
                  className="flex-1 text-xs rounded-md border border-slate-700 bg-slate-900 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  min={0}
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-28 text-xs rounded-md border border-slate-700 bg-slate-900 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Query params & headers & body */}
          <div className="flex-1 overflow-auto text-xs">
            {/* Query params */}
            <section className="px-4 py-3 border-b border-slate-900">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
                  Query Params
                </h3>
                <button
                  onClick={() => addRow("query")}
                  className="text-[11px] text-sky-400 hover:text-sky-300"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1.5">
                {queryRows.map((row) => (
                  <div key={row.id} className="flex items-center gap-1.5">
                    <input
                      placeholder="key"
                      value={row.key}
                      onChange={(e) =>
                        updateRow("query", row.id, "key", e.target.value)
                      }
                      className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <span className="text-slate-500">=</span>
                    <input
                      placeholder="value"
                      value={row.value}
                      onChange={(e) =>
                        updateRow("query", row.id, "value", e.target.value)
                      }
                      className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      onClick={() => removeRow("query", row.id)}
                      className="text-slate-500 hover:text-rose-400 px-1"
                      aria-label="Remove query param"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Headers */}
            <section className="px-4 py-3 border-b border-slate-900">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
                  Headers
                </h3>
                <button
                  onClick={() => addRow("header")}
                  className="text-[11px] text-sky-400 hover:text-sky-300"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1.5">
                {headerRows.map((row) => (
                  <div key={row.id} className="flex items-center gap-1.5">
                    <input
                      placeholder="Header name"
                      value={row.key}
                      onChange={(e) =>
                        updateRow("header", row.id, "key", e.target.value)
                      }
                      className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <span className="text-slate-500">:</span>
                    <input
                      placeholder="Header value"
                      value={row.value}
                      onChange={(e) =>
                        updateRow("header", row.id, "value", e.target.value)
                      }
                      className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      onClick={() => removeRow("header", row.id)}
                      className="text-slate-500 hover:text-rose-400 px-1"
                      aria-label="Remove header"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Body */}
            <section className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
                  Body
                </h3>
                <span className="text-[11px] text-slate-500">
                  Parsed as JSON when possible
                </span>
              </div>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder='{"example": "value"}'
                className="w-full min-h-[120px] rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 font-mono text-[11px] leading-relaxed resize-vertical focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              {["GET", "HEAD"].includes(method) && (
                <p className="mt-1 text-[11px] text-amber-400">
                  Body will be ignored for {method} requests.
                </p>
              )}
            </section>
          </div>
        </div>

        {/* Right: Response preview */}
        <div className="flex flex-col overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-slate-900 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
              Response
            </h3>
            <span className="text-[11px] text-slate-400">
              {responseStatus || "No request sent yet"}
            </span>
          </div>
          <div className="flex-1 overflow-auto bg-slate-950 px-4 py-3">
            <pre className="text-[11px] leading-relaxed font-mono text-slate-200 whitespace-pre-wrap">
              {responsePreview || "// Response body will appear here"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
