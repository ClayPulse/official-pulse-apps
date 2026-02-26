import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./tailwind.css";
import { useActionEffect, useLoading } from "@pulse-editor/react-api";

type SearchStatus = "idle" | "searching" | "done" | "error";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [sitesSearched, setSitesSearched] = useState(0);
  const [searchedUrls, setSearchedUrls] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isReady) toggleLoading(false);
  }, [isReady, toggleLoading]);

  useActionEffect(
    {
      actionName: "webSearch",
      beforeAction: async (args) => {
        abortRef.current?.abort();
        abortRef.current = null;
        setQuery(args.query ?? "");
        setStatus("searching");
        setSitesSearched(0);
        setSearchedUrls([]);
        setSummary("");
        setErrorMsg("");
      },
      afterAction: async (results) => {
        if (results.error) {
          setErrorMsg(String(results.error));
          setStatus("error");
        } else {
          setSummary(results.summary ?? "");
          setSearchedUrls(results.urls ?? []);
          setStatus("done");
        }
      },
    },
    [],
  );

  const handleSearch = async () => {
    if (!query.trim() || status === "searching") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("searching");
    setSitesSearched(0);
    setSearchedUrls([]);
    setSummary("");
    setErrorMsg("");

    try {
      const response = await fetch("/server-function/web-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
            if (data.type === "progress") {
              setSitesSearched(data.sitesSearched);
              if (Array.isArray(data.urls)) setSearchedUrls(data.urls);
            } else if (data.type === "result") {
              setSummary(data.summary);
              if (Array.isArray(data.urls)) setSearchedUrls(data.urls);
              setStatus("done");
            } else if (data.type === "error") {
              setErrorMsg(data.message);
              setStatus("error");
            }
          } catch {
            // ignore malformed event
          }
        }
      }

      setStatus((prev) => (prev === "searching" ? "done" : prev));
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setErrorMsg(String(err));
        setStatus("error");
      }
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-hidden bg-gray-950 text-gray-100">
      {/* Header */}
      <h1 className="text-base font-semibold text-gray-200 tracking-tight">
        Agentic Web Search
      </h1>

      {/* Input section */}
      <div className="flex flex-col gap-2">
        <textarea
          className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-lg p-3 resize-none text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          rows={3}
          placeholder="What would you like to search for?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSearch();
            }
          }}
          disabled={status === "searching"}
        />
        <button
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm cursor-pointer disabled:cursor-not-allowed"
          onClick={handleSearch}
          disabled={status === "searching" || !query.trim()}
        >
          {status === "searching" ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Progress */}
      {status === "searching" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 text-sm text-gray-400">
            <div className="w-4 h-4 shrink-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>
              Searching the web
              {sitesSearched > 0 && (
                <>
                  {" "}
                  &mdash;{" "}
                  <span className="text-blue-400 font-medium">
                    {sitesSearched}
                  </span>{" "}
                  {sitesSearched === 1 ? "search" : "searches"} so far
                </>
              )}
            </span>
          </div>
          {searchedUrls.length > 0 && (
            <div className="flex flex-col gap-1 pl-6">
              {searchedUrls.map((url) => (
                <div key={url} className="flex items-center gap-1.5 min-w-0">
                  <div className="w-1 h-1 shrink-0 rounded-full bg-gray-600" />
                  <span className="text-xs text-gray-500 truncate">{url}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg p-3">
          {errorMsg || "An error occurred. Please try again."}
        </div>
      )}

      {/* Result */}
      {(status === "done" || status === "searching") && summary && (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Summary
            </span>
            {status === "done" && sitesSearched > 0 && (
              <span className="text-xs text-gray-600">
                {sitesSearched} {sitesSearched === 1 ? "search" : "searches"}{" "}
                performed
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div
              className="text-sm text-gray-200 leading-relaxed prose prose-invert prose-sm max-w-none
                prose-headings:font-semibold prose-headings:text-gray-100
                prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                prose-p:text-gray-200 prose-p:my-1.5
                prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-100
                prose-code:text-blue-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded prose-code:text-xs
                prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
                prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5
                prose-hr:border-gray-700"
            >
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>
          {status === "done" && searchedUrls.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Sources
              </span>
              <div className="flex flex-col gap-1 bg-gray-900 border border-gray-800 rounded-lg p-2">
                {searchedUrls.map((url) => (
                  <div key={url} className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1 h-1 shrink-0 rounded-full bg-gray-600" />
                    <span className="text-xs text-gray-400 truncate">
                      {url}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
