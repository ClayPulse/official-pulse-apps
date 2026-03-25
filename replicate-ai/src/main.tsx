import React, { useEffect, useState } from "react";
import "./tailwind.css";
import {
  useLoading,
  useActionEffect,
  useSnapshotState,
  SnapshotProvider,
} from "@pulse-editor/react-api";

function ReplicateApp() {
  const { isReady, toggleLoading } = useLoading();
  const [model, setModel] = useSnapshotState(
    "model",
    "black-forest-labs/flux-schnell",
  );
  const [inputJson, setInputJson] = useState(
    '{\n  "prompt": "a cat astronaut riding a bicycle on mars"\n}',
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isReady) toggleLoading(false);
  }, [isReady, toggleLoading]);

  const { runAppAction } = useActionEffect(
    {
      actionName: "run-model",
      beforeAction: async (args: any) => {
        if (!args) return args;

        setLoading(true);
        setError("");
        setResult(null);
        return args;
      },
      afterAction: async (result: any) => {
        if (!result) return result;

        setLoading(false);
        if (result.error) {
          setError(result.error);
        } else {
          setResult(result);
        }
        return result;
      },
    },
    [],
  );

  async function handleRun() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const parsedInput = JSON.parse(inputJson);
      const res = await runAppAction!({ model, input: parsedInput });
      if (res?.error) {
        setError(res.error);
      } else {
        setResult(res);
      }
    } catch (e: any) {
      setError(e.message || "Failed to run model");
    } finally {
      setLoading(false);
    }
  }

  const outputItems = result?.output;
  const isImageOutput =
    Array.isArray(outputItems) &&
    outputItems.length > 0 &&
    typeof outputItems[0] === "string" &&
    (outputItems[0].startsWith("http") || outputItems[0].startsWith("data:"));

  return (
    <div className="p-3 flex flex-col w-full h-full overflow-hidden gap-y-2 text-sm">
      <div className="flex-shrink-0 flex flex-col gap-y-2">
        <h1 className="text-lg font-bold">Replicate AI</h1>

        <label className="font-medium">Model</label>
        <input
          className="border border-gray-300 rounded px-2 py-1 font-mono text-xs"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="owner/model-name"
        />

        <label className="font-medium">Input (JSON)</label>
        <textarea
          className="border border-gray-300 rounded px-2 py-1 font-mono text-xs min-h-[100px]"
          value={inputJson}
          onChange={(e) => setInputJson(e.target.value)}
        />

        <button
          className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={handleRun}
          disabled={loading || !runAppAction}
        >
          {loading ? "Running..." : "Run Model"}
        </button>

        {error && <p className="text-red-500">{error}</p>}
      </div>

      {result && (
        <div className="flex-1 min-h-0 flex flex-col gap-y-1 overflow-auto">
          {result.metrics?.predict_time && (
            <p className="flex-shrink-0 text-gray-500 text-xs">
              Completed in {result.metrics.predict_time.toFixed(1)}s
            </p>
          )}

          {isImageOutput ? (
            <div className="flex-1 min-h-0 flex flex-col gap-y-2">
              {outputItems.map((url: string, i: number) => (
                <img
                  key={i}
                  src={url}
                  alt={`Output ${i}`}
                  className="rounded max-w-full max-h-full object-contain"
                />
              ))}
            </div>
          ) : (
            <pre className="flex-1 min-h-0 bg-gray-100 rounded p-2 text-xs overflow-auto whitespace-pre-wrap">
              {typeof result.output === "string"
                ? result.output
                : JSON.stringify(result.output, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function Main() {
  return (
    <SnapshotProvider>
      <ReplicateApp />
    </SnapshotProvider>
  );
}
