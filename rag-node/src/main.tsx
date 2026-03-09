import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

type Document = {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
  text: string;
};

type Mode = "query" | "write";


export default function Main() {
  const { isReady, toggleLoading } = useLoading();

  const [mode, setMode] = useState<Mode>("query");

  // Query state
  const [query, setQuery] = useState("");
  const [k, setK] = useState(5);
  const [indexName, setIndexName] = useState("");
  const [namespace, setNamespace] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Write state
  const [writeText, setWriteText] = useState("");
  const [writeIndexName, setWriteIndexName] = useState("");
  const [writeNamespace, setWriteNamespace] = useState("");
  const [writeLoading, setWriteLoading] = useState(false);
  const [writeError, setWriteError] = useState("");
  const [writeSuccess, setWriteSuccess] = useState("");

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  const { runAppAction: runQuery } = useActionEffect(
    {
      actionName: "rag-query",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeAction: async (args: any) => {
        if (args?.query) setQuery(args.query);
        if (args?.k) setK(args.k);
        if (args?.indexName) setIndexName(args.indexName);
        if (args?.namespace) setNamespace(args.namespace);
        setMode("query");
        setLoading(true);
        setError("");
        setDocuments([]);
        return args;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      afterAction: async (result: any) => {
        setLoading(false);
        if (result?.error) {
          setError(result.error);
        } else if (result?.documents) {
          setDocuments(result.documents);
        }
        return result;
      },
    },
    [],
  );

  const { runAppAction: runWrite } = useActionEffect(
    {
      actionName: "rag-write",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeAction: async (args: any) => {
        if (args?.text) setWriteText(args.text);
        if (args?.indexName) setWriteIndexName(args.indexName);
        if (args?.namespace) setWriteNamespace(args.namespace);
        setMode("write");
        setWriteLoading(true);
        setWriteError("");
        setWriteSuccess("");
        return args;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      afterAction: async (result: any) => {
        setWriteLoading(false);
        if (result?.error) {
          setWriteError(result.error);
        } else if (result?.upsertedCount !== undefined) {
          setWriteSuccess(`Successfully upserted ${result.upsertedCount} document(s).`);
        }
        return result;
      },
    },
    [],
  );

  const handleQuery = async () => {
    if (!query || !indexName || !runQuery) return;
    setLoading(true);
    setError("");
    setDocuments([]);
    try {
      const result = await runQuery({
        query,
        k,
        indexName,
        ...(namespace ? { namespace } : {}),
      });
      if (result?.error) {
        setError(result.error);
      } else if (result?.documents) {
        setDocuments(result.documents);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWrite = async () => {
    if (!writeText || !writeIndexName || !runWrite) return;
    setWriteLoading(true);
    setWriteError("");
    setWriteSuccess("");
    try {
      const result = await runWrite({
        text: writeText,
        indexName: writeIndexName,
        ...(writeNamespace ? { namespace: writeNamespace } : {}),
      });
      if (result?.error) {
        setWriteError(result.error);
      } else if (result?.upsertedCount !== undefined) {
        setWriteSuccess(`Successfully upserted ${result.upsertedCount} document(s).`);
      }
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "Write failed");
    } finally {
      setWriteLoading(false);
    }
  };


  return (
    <div className="p-4 flex flex-col w-full h-full overflow-auto gap-y-3">
      <div className="flex items-center gap-x-2">
        <button
          className={`py-1 px-3 rounded font-semibold text-sm ${mode === "query" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setMode("query")}
        >
          Query
        </button>
        <button
          className={`py-1 px-3 rounded font-semibold text-sm ${mode === "write" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setMode("write")}
        >
          Write
        </button>
      </div>

      {mode === "query" && (
        <>
          <h1 className="text-lg font-bold">RAG Query</h1>
          <div className="flex flex-col gap-y-2">
            <input
              className="border border-gray-300 rounded p-2"
              type="text"
              placeholder="Index name"
              value={indexName}
              onChange={(e) => setIndexName(e.target.value)}
            />
            <input
              className="border border-gray-300 rounded p-2"
              type="text"
              placeholder="Namespace (optional)"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
            />
            <input
              className="border border-gray-300 rounded p-2"
              type="text"
              placeholder="Enter your query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex items-center gap-x-2">
              <label className="text-sm">Top K:</label>
              <input
                className="border border-gray-300 rounded p-2 w-20"
                type="number"
                min={1}
                max={100}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
              />
            </div>
            <button
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              onClick={handleQuery}
              disabled={loading || !query || !indexName}
            >
              {loading ? "Querying..." : "Search"}
            </button>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          {documents.length > 0 && (
            <div className="flex flex-col gap-y-2">
              <h2 className="font-semibold">Results ({documents.length})</h2>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded p-3 bg-gray-50"
                >
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>{doc.id}</span>
                    <span>Score: {doc.score.toFixed(4)}</span>
                  </div>
                  {doc.text && <p className="text-sm">{doc.text}</p>}
                  {Object.keys(doc.metadata).length > 0 && (
                    <details className="mt-1">
                      <summary className="text-xs text-gray-400 cursor-pointer">
                        Metadata
                      </summary>
                      <pre className="text-xs mt-1 overflow-auto">
                        {JSON.stringify(doc.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode === "write" && (
        <>
          <h1 className="text-lg font-bold">RAG Write</h1>
          <div className="flex flex-col gap-y-2">
            <input
              className="border border-gray-300 rounded p-2"
              type="text"
              placeholder="Index name"
              value={writeIndexName}
              onChange={(e) => setWriteIndexName(e.target.value)}
            />
            <input
              className="border border-gray-300 rounded p-2"
              type="text"
              placeholder="Namespace (optional)"
              value={writeNamespace}
              onChange={(e) => setWriteNamespace(e.target.value)}
            />
            <textarea
              className="border border-gray-300 rounded p-2"
              placeholder="Text content to store..."
              rows={4}
              value={writeText}
              onChange={(e) => setWriteText(e.target.value)}
            />
            <button
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              onClick={handleWrite}
              disabled={writeLoading || !writeIndexName || !writeText}
            >
              {writeLoading ? "Writing..." : "Write to Index"}
            </button>
          </div>

          {writeError && <p className="text-red-500">{writeError}</p>}
          {writeSuccess && <p className="text-green-600">{writeSuccess}</p>}
        </>
      )}
    </div>
  );
}
