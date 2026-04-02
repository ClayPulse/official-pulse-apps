import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const [content, setContent] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  const { runAppAction } = useActionEffect(
    {
      actionName: "generate-pdf",
      beforeAction: async (args: any) => {
        if (!args) return;
        setGenerating(true);
        setError("");
        setContent(args.content || "");
        return args;
      },
      afterAction: async (result: any) => {
        if (!result) return;
        setPdfBase64(result.pdf);
        setGenerating(false);
        return result;
      },
    },
    [],
  );

  async function handleGenerate() {
    if (!content.trim()) return;
    setGenerating(true);
    setPdfBase64("");
    setError("");
    try {
      const result = await runAppAction?.({ content });
      if (result?.pdf) {
        setPdfBase64(result.pdf);
      }
    } catch (err: any) {
      const message = err?.message || "PDF generation failed";
      setError(message);
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (!pdfBase64) return;
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = "document.pdf";
    link.click();
  }

  return (
    <div className="flex flex-col w-full h-full overflow-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-6 gap-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">
          PDF Doc Generator
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Enter text content to generate a PDF document
        </p>
      </div>

      {/* Text Input */}
      <textarea
        className="flex-1 min-h-[200px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
        placeholder="Enter or paste your text content here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          onClick={handleGenerate}
          disabled={generating || !content.trim()}
        >
          {generating ? "Generating..." : "Generate PDF"}
        </button>
        {pdfBase64 && (
          <button
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20"
            onClick={handleDownload}
          >
            Download
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Status */}
      {pdfBase64 && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
          PDF generated ({Math.round((pdfBase64.length * 3) / 4 / 1024)} KB)
        </div>
      )}
    </div>
  );
}
