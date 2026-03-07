import React, { useEffect, useRef, useState } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

const LLM_MODELS = ["gpt-5.4", "gpt-5-mini"] as const;
type LlmModel = (typeof LLM_MODELS)[number];

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const [prompt, setPrompt] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [llmModel, setLlmModel] = useState<LlmModel>(LLM_MODELS[0]);
  const llmModelRef = useRef<LlmModel>(LLM_MODELS[0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  const { runAppAction } = useActionEffect(
    {
      actionName: "run-llm",
      beforeAction: (input) => {
        setPrompt(input);
        return { ...input, llmModel: llmModelRef.current };
      },
      afterAction: (output) => {
        if (output) {
          setResult(output.response ?? "");
          return output;
        }
      },
    },
    [],
  );

  return (
    <div className="p-2 flex flex-col w-full h-full overflow-auto">
      <div className="flex items-center gap-x-1">
        GitHub:
        <button
          className="w-8 h-8 border border-gray-300 rounded-full p-1 hover:bg-gray-100"
          onClick={() => {
            window.open(
              "https://github.com/claypulse/official-pulse-apps",
              "_blank",
            );
          }}
        >
          <img
            src="assets/github-mark-light.svg"
            alt="GitHub"
            className="w-full h-full"
          />
        </button>
      </div>

      <p>
        This is a simple LLM node. Connect input and output node to get results
        from an LLM model.
      </p>

      <div className="mt-2 flex flex-col gap-y-1">
        <label className="text-sm font-medium" htmlFor="llm-model-select">
          Model
        </label>
        <select
          id="llm-model-select"
          value={llmModel}
          onChange={(e) => {
            const m = e.target.value as LlmModel;
            llmModelRef.current = m;
            setLlmModel(m);
          }}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
        >
          {LLM_MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Make the input */}
      <div className="mt-2 flex flex-col gap-y-1">
        <label className="text-sm font-medium" htmlFor="llm-input">
          Input
        </label>
        <textarea
          id="llm-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              alert(runAppAction);
              // Trigger the action by dispatching a custom event
              if (runAppAction) {
                setIsLoading(true);
                await runAppAction({
                  actionName: "run-llm",
                });
                setIsLoading(false);
              }
            }
          }}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
        />
      </div>

      {isLoading && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">Loading...</div>
      )}

      {result && !isLoading && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
}
