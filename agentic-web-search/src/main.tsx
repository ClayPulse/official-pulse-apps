import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./tailwind.css";
import { useActionEffect, useLoading, useSnapshotState, SnapshotProvider } from "@pulse-editor/react-api";
import { setPendingResult } from "./skill/web-search/action";

type SearchStatus = "idle" | "searching" | "done" | "error";
type Source = { url: string; title: string; page_age?: string };
type Provider = "claude" | "openai";
type ClaudeModel = "claude-opus-4-6" | "claude-sonnet-4-6";
type OpenAIModel = "gpt-5.4" | "gpt-5-mini";
type Model = ClaudeModel | OpenAIModel;

const CLAUDE_MODELS: { value: ClaudeModel; label: string }[] = [
  { value: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { value: "claude-opus-4-6", label: "Opus 4.6" },
];

const OPENAI_MODELS: { value: OpenAIModel; label: string }[] = [
  { value: "gpt-5.4", label: "GPT-5.4" },
  { value: "gpt-5-mini", label: "GPT-5 Mini" },
];

function App() {
  const { isReady, toggleLoading } = useLoading();
  const [provider, setProvider] = useSnapshotState<Provider>("provider", "claude");
  const [claudeModel, setClaudeModel] = useSnapshotState<ClaudeModel>("claudeModel", "claude-sonnet-4-6");
  const [openaiModel, setOpenaiModel] = useSnapshotState<OpenAIModel>("openaiModel", "gpt-5.4");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [sitesSearched, setSitesSearched] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [summary, setSummary] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const activeModel: Model = provider === "claude" ? claudeModel : openaiModel;

  const startSearch = useCallback(async (searchQuery: string, searchProvider: Provider, searchModel: Model, signal?: AbortSignal): Promise<{ summary: string; urls: string[]; sources: Source[] }> => {
    setStatus("searching");
    setSitesSearched(0);
    setIsGenerating(false);
    setSources([]);
    setSummary("");
    setErrorMsg("");

    let finalSummary = "";
    let finalUrls: string[] = [];
    let finalSources: Source[] = [];

    try {
      const response = await fetch("/server-function/web-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim(), provider: searchProvider, model: searchModel }),
        signal,
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
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (data.type === "progress") {
            setSitesSearched(data.sitesSearched as number);
            if (Array.isArray(data.sources)) setSources(data.sources as Source[]);
          } else if (data.type === "generating") {
            setIsGenerating(true);
          } else if (data.type === "text_delta") {
            setIsGenerating(false);
            finalSummary += data.text as string;
            setSummary((prev) => prev + (data.text as string));
          } else if (data.type === "search_error") {
            console.warn("Web search error:", data.error_code);
          } else if (data.type === "result") {
            finalSummary = data.summary as string;
            finalUrls = (data.urls as string[]) ?? [];
            finalSources = (data.sources as Source[]) ?? [];
            setSummary(finalSummary);
            if (Array.isArray(data.sources)) setSources(finalSources);
            setStatus("done");
          } else if (data.type === "error") {
            setErrorMsg(data.message as string);
            setStatus("error");
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

    return { summary: finalSummary, urls: finalUrls, sources: finalSources };
  }, []);

  useEffect(() => {
    if (isReady) toggleLoading(false);
  }, [isReady, toggleLoading]);

  useActionEffect(
    {
      actionName: "web-search",
      beforeAction: async (args) => {
        abortRef.current?.abort();
        abortRef.current = null;
        setQuery(args.query ?? "");
        const result = await startSearch(args.query ?? "", provider, activeModel);
        setPendingResult(result);
        return args;
      },
      afterAction: async () => {
        // Streaming handles its own state — nothing to do here
      },
    },
    [startSearch, provider, activeModel],
  );

  const handleSearch = async () => {
    if (!query.trim() || status === "searching") return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    await startSearch(query, provider, activeModel, controller.signal);
  };

  const modelOptions = provider === "claude" ? CLAUDE_MODELS : OPENAI_MODELS;

  return (
    <div className="flex flex-col h-full p-4 gap-3 overflow-hidden bg-gray-950 text-gray-100">
      {/* Header */}
      <h1 className="shrink-0 text-base font-semibold text-gray-200 tracking-tight">
        Agentic Web Search
      </h1>

      {/* Provider selector */}
      <div className="shrink-0 flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
        {(["claude", "openai"] as Provider[]).map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            disabled={status === "searching"}
            className={`flex-1 py-1 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${
              provider === p
                ? "bg-gray-700 text-gray-100"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {p === "claude" ? "Claude" : "OpenAI"}
          </button>
        ))}
      </div>

      {/* Model selector */}
      <div className="shrink-0 flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
        {modelOptions.map(({ value, label }) => {
          const isActive = (provider === "claude" ? claudeModel : openaiModel) === value;
          return (
            <button
              key={value}
              onClick={() => provider === "claude" ? setClaudeModel(value as ClaudeModel) : setOpenaiModel(value as OpenAIModel)}
              disabled={status === "searching"}
              className={`flex-1 py-1 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${
                isActive
                  ? "bg-gray-700 text-gray-100"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="flex flex-col flex-1 gap-3 min-h-0">

        {/* Prompt section */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <textarea
            className="flex-1 w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-lg p-3 resize-none text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors min-h-0"
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
            className="shrink-0 w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm cursor-pointer disabled:cursor-not-allowed"
            onClick={handleSearch}
            disabled={status === "searching" || !query.trim()}
          >
            {status === "searching" ? "Searching..." : "Search"}
          </button>
          {status === "searching" && (
            <div className="shrink-0 flex items-center gap-2 text-sm text-gray-400">
              <div className="w-3.5 h-3.5 shrink-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              {isGenerating ? (
                <span className="text-blue-300">Generating response&hellip;</span>
              ) : (
                <span>
                  Searching the web
                  {sitesSearched > 0 && (
                    <>
                      {" "}&mdash;{" "}
                      <span className="text-blue-400 font-medium">{sitesSearched}</span>
                      {" "}{sitesSearched === 1 ? "search" : "searches"} so far
                    </>
                  )}
                </span>
              )}
            </div>
          )}
          {status === "error" && (
            <div className="shrink-0 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg p-3">
              {errorMsg || "An error occurred. Please try again."}
            </div>
          )}
        </div>

        {/* Summary section */}
        {(status === "searching" || status === "done") && (
          <div className="flex-2 flex flex-col gap-1 min-h-0">
            <div className="shrink-0 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Summary
              </span>
              {status === "done" && sitesSearched > 0 && (
                <span className="text-xs text-gray-600">
                  {sitesSearched} {sitesSearched === 1 ? "search" : "searches"} performed
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-900 border border-gray-800 rounded-lg p-3 min-h-0">
              {summary ? (
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-600">
                  Waiting for response&hellip;
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sources section */}
        {sources.length > 0 && (
          <div className="flex-1 flex flex-col gap-1 min-h-0">
            <span className="shrink-0 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Sources
            </span>
            <div className="flex-1 overflow-y-auto bg-gray-900 border border-gray-800 rounded-lg p-2 min-h-0">
              {sources.map((source) => (
                <div key={source.url} className="flex items-center gap-1.5 min-w-0 py-0.5">
                  <div className="w-1 h-1 shrink-0 rounded-full bg-gray-600" />
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline truncate"
                    title={source.url}
                  >
                    {source.title || source.url}
                  </a>
                  {source.page_age && (
                    <span className="text-xs text-gray-600 shrink-0">
                      {source.page_age}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function Main() {
  return (
    <SnapshotProvider>
      <App />
    </SnapshotProvider>
  );
}
