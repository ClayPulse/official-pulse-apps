import React, { useEffect, useState } from "react";
import "./tailwind.css";
import {
  useLoading,
  useActionEffect,
  useSnapshotState,
  SnapshotProvider,
} from "@pulse-editor/react-api";
import { MODEL_CATALOG, type Model } from "./models";

function Spinner() {
  return (
    <svg
      className="w-4 h-4"
      style={{ animation: "spin 0.7s linear infinite" }}
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ModelCard({
  model,
  selected,
  onClick,
}: {
  model: Model;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="text-left w-full transition-all duration-150"
      style={{
        padding: "8px 10px",
        background: selected ? "var(--gray-3)" : "var(--gray-1)",
        border: selected ? "1.5px solid var(--gray-8)" : "1px solid var(--gray-4)",
        borderRadius: 10,
        boxShadow: selected ? "var(--elevation-2)" : "var(--elevation-1)",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.boxShadow = "var(--elevation-2)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.boxShadow = "var(--elevation-1)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
      onClick={onClick}
    >
      <p
        className="font-semibold truncate"
        style={{ fontSize: 12, color: "var(--gray-12)", lineHeight: 1.3 }}
      >
        {model.label}
      </p>
      <p
        className="truncate"
        style={{
          fontSize: 11,
          color: "var(--gray-9)",
          lineHeight: 1.3,
          marginTop: 2,
        }}
      >
        {model.description}
      </p>
    </button>
  );
}

function ModelPickerModal({
  category,
  model,
  onSelectCategory,
  onSelectModel,
  onClose,
}: {
  category: string;
  model: string;
  onSelectCategory: (key: string) => void;
  onSelectModel: (m: Model) => void;
  onClose: () => void;
}) {
  const currentCat = MODEL_CATALOG[category];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
        }}
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className="flex flex-col"
        style={{
          position: "relative",
          width: "100%",
          maxHeight: "85%",
          background: "var(--gray-1)",
          borderRadius: "16px 16px 0 0",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Modal header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--gray-4)" }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-12)" }}>
            Choose a model
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "none",
              background: "var(--gray-3)",
              color: "var(--gray-11)",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </div>

        {/* Category chips */}
        <div
          className="flex-shrink-0 flex items-center gap-1.5 overflow-x-auto px-4 py-2.5"
          style={{ borderBottom: "1px solid var(--gray-4)" }}
        >
          {Object.entries(MODEL_CATALOG).map(([key, cat]) => {
            const active = category === key;
            return (
              <button
                key={key}
                className="whitespace-nowrap transition-all duration-150"
                style={{
                  padding: "5px 12px",
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--gray-1)" : "var(--gray-11)",
                  background: active ? "var(--gray-12)" : "var(--gray-1)",
                  borderRadius: 20,
                  border: active ? "1px solid var(--gray-12)" : "1px solid var(--gray-5)",
                  boxShadow: active ? "var(--elevation-1)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--gray-3)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--gray-1)";
                }}
                onClick={() => onSelectCategory(key)}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Model grid */}
        <div className="flex-1 min-h-0 overflow-auto px-3 py-3">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 8 }}>
            {currentCat.models.map((m) => (
              <ModelCard
                key={m.id}
                model={m}
                selected={model === m.id}
                onClick={() => onSelectModel(m)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReplicateApp() {
  const { isReady, toggleLoading } = useLoading();
  const [model, setModel] = useSnapshotState(
    "model",
    "black-forest-labs/flux-2-pro",
  );
  const [category, setCategory] = useState("image");
  const [inputJson, setInputJson] = useState(
    MODEL_CATALOG["image"].defaultInput,
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (isReady) toggleLoading(false);
  }, [isReady, toggleLoading]);

  const actionCallback = {
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
      if (result.error) setError(result.error);
      else setResult(result);
      return result;
    },
  };

  const { runAppAction } = useActionEffect(
    { actionName: "run-model", ...actionCallback },
    [],
  );
  useActionEffect({ actionName: "generate-image", ...actionCallback }, []);
  useActionEffect({ actionName: "image-tools", ...actionCallback }, []);
  useActionEffect({ actionName: "kontext-apps", ...actionCallback }, []);
  useActionEffect({ actionName: "generate-video", ...actionCallback }, []);
  useActionEffect({ actionName: "video-tools", ...actionCallback }, []);
  useActionEffect({ actionName: "generate-audio", ...actionCallback }, []);
  useActionEffect({ actionName: "language-model", ...actionCallback }, []);
  useActionEffect({ actionName: "generate-3d", ...actionCallback }, []);

  async function handleRun() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const parsedInput = JSON.parse(inputJson);
      const res = await runAppAction!({ model, input: parsedInput });
      if (res?.error) setError(res.error);
      else setResult(res);
    } catch (e: any) {
      setError(e.message || "Failed to run model");
    } finally {
      setLoading(false);
    }
  }

  // Find display label for current model
  const selectedLabel =
    Object.values(MODEL_CATALOG)
      .flatMap((c) => c.models)
      .find((m) => m.id === model)?.label || model;

  const rawOutput = result?.output;
  const outputItems: string[] = Array.isArray(rawOutput)
    ? rawOutput.filter((v: any) => typeof v === "string")
    : typeof rawOutput === "string"
      ? [rawOutput]
      : [];

  function looksLikeImageUrl(url: string): boolean {
    if (url.startsWith("data:image")) return true;
    if (!url.startsWith("http")) return false;
    if (/\.(mp4|mp3|wav|ogg|webm|glb|gltf|obj|fbx|zip)(\?|$)/i.test(url)) return false;
    if (/\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff)(\?|$)/i.test(url)) return true;
    if (/replicate\.(delivery|com)/.test(url)) return true;
    return false;
  }

  const isImageOutput = outputItems.length > 0 && outputItems.every(looksLikeImageUrl);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ color: "var(--gray-12)" }}>
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center px-4 py-2.5"
        style={{
          background: "var(--gray-1)",
          boxShadow: "var(--elevation-1)",
          zIndex: 10,
        }}
      >
        <span
          className="font-bold"
          style={{
            fontSize: 15,
            background: "linear-gradient(135deg, #ea2804, #e54fe2, #ed686c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          replicate
        </span>
      </div>

      {/* Input section */}
      <div
        className="flex-shrink-0 flex flex-col gap-2 mx-3 mt-3 mb-3 p-3"
        style={{
          background: "var(--gray-2)",
          borderRadius: 14,
          border: "1px solid var(--gray-4)",
        }}
      >
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-11)" }}>
          Model
        </label>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 font-mono"
            style={{
              padding: "8px 10px",
              fontSize: 11,
              background: "var(--gray-1)",
              border: "1px solid var(--gray-4)",
              borderRadius: 10,
              color: "var(--gray-12)",
            }}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="owner/model-name"
          />
          <button
            onClick={() => setPickerOpen(true)}
            style={{
              padding: "8px 12px",
              fontSize: 11,
              fontWeight: 600,
              background: "var(--gray-1)",
              border: "1px solid var(--gray-4)",
              borderRadius: 10,
              color: "var(--gray-11)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gray-3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--gray-1)";
            }}
          >
            Browse
          </button>
        </div>

        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-11)" }}>
          Input
        </label>
        <textarea
          className="font-mono resize-none"
          style={{
            padding: "10px 12px",
            fontSize: 11,
            lineHeight: 1.6,
            minHeight: 72,
            background: "var(--gray-1)",
            border: "1px solid var(--gray-4)",
            borderRadius: 10,
            color: "var(--gray-12)",
          }}
          value={inputJson}
          onChange={(e) => setInputJson(e.target.value)}
        />
        <button
          className="w-full flex items-center justify-center gap-2 font-semibold disabled:opacity-40 transition-all duration-100"
          style={{
            padding: "10px 16px",
            fontSize: 13,
            background: "var(--gray-12)",
            color: "var(--gray-1)",
            border: "none",
            borderRadius: 10,
            cursor: loading ? "wait" : "pointer",
            boxShadow: "var(--elevation-2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "var(--elevation-3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "var(--elevation-2)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(1px)";
            e.currentTarget.style.boxShadow = "var(--elevation-1)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--elevation-3)";
          }}
          onClick={handleRun}
          disabled={loading || !runAppAction}
        >
          {loading && <Spinner />}
          {loading ? "Running..." : "Run"}
        </button>
        {error && (
          <div
            style={{
              padding: "8px 10px",
              fontSize: 11,
              color: "var(--tomato-9)",
              background: "rgba(229,77,46,0.06)",
              borderRadius: 8,
              border: "1px solid rgba(229,77,46,0.15)",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Output */}
      {result && (
        <div className="flex-1 min-h-0 flex flex-col overflow-auto px-3 pb-3 gap-2">
          {result.metrics?.predict_time && (
            <div
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2"
              style={{
                background: "rgba(48,164,108,0.06)",
                borderRadius: 8,
                border: "1px solid rgba(48,164,108,0.15)",
              }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: "var(--green-9)" }}
              />
              <span style={{ fontSize: 11, color: "var(--green-9)", fontWeight: 500 }}>
                Completed in {result.metrics.predict_time.toFixed(2)}s
              </span>
            </div>
          )}
          {isImageOutput ? (
            <div className="flex-1 min-h-0 flex flex-col gap-2">
              {outputItems.map((url: string, i: number) => (
                <img
                  key={i}
                  src={url}
                  alt={`Output ${i}`}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    borderRadius: 12,
                    boxShadow: "var(--elevation-2)",
                  }}
                />
              ))}
            </div>
          ) : (
            <pre
              className="flex-1 min-h-0 overflow-auto whitespace-pre-wrap font-mono"
              style={{
                padding: 12,
                fontSize: 11,
                background: "var(--gray-2)",
                border: "1px solid var(--gray-4)",
                borderRadius: 12,
                color: "var(--gray-12)",
              }}
            >
              {typeof result.output === "string"
                ? result.output
                : JSON.stringify(result.output, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Model picker modal */}
      {pickerOpen && (
        <ModelPickerModal
          category={category}
          model={model}
          onSelectCategory={(key) => {
            setCategory(key);
            setInputJson(MODEL_CATALOG[key].defaultInput);
          }}
          onSelectModel={(m) => {
            setModel(m.id);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
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
