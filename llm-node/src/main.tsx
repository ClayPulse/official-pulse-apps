import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

const LLM_MODELS = ["gpt-5.4", "gpt-5-mini"];

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const [llmPrompt, setLLMPrompt] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [llmModel, setLlmModel] = useState<string>(LLM_MODELS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === "string" && error) {
      return error;
    }

    return "Failed to run LLM request.";
  };

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  const { runAppAction } = useActionEffect(
    {
      actionName: "run-llm",
      beforeAction: async (input) => {
        const prompt = input.prompt ?? llmPrompt;
        setLLMPrompt(prompt);

        const model = input.llmModel ?? llmModel;
        setLlmModel(model);

        return {
          prompt,
          llmModel: model,
        };
      },
      afterAction: async (output) => {
        if (output) {
          setResult(() => output.response ?? "");
          return output;
        }
      },
    },
    [llmModel, llmPrompt],
  );

  return (
    <div className="p-2 flex flex-col w-full h-full overflow-auto text-gray-900 dark:text-gray-100">
      <div className="flex items-center gap-x-1">
        GitHub:
        <button
          className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
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
            const m = e.target.value;
            setLlmModel(m);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          {
            // Add entered LLM as an option
            [...new Set([llmModel, ...LLM_MODELS])].map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))
          }
        </select>
      </div>

      {/* Make the input */}
      <div className="mt-2 flex flex-col gap-y-1">
        <label className="text-sm font-medium" htmlFor="llm-input">
          Input
        </label>
        <textarea
          id="llm-input"
          value={llmPrompt}
          onChange={(e) => setLLMPrompt(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              // Trigger the action by dispatching a custom event
              if (runAppAction) {
                setIsLoading(true);
                try {
                  const response = await runAppAction({
                    prompt: llmPrompt,
                    llmModel: llmModel,
                  });
                  setResult(response?.response ?? "");
                } catch (error) {
                  setResult(getErrorMessage(error));
                } finally {
                  setIsLoading(false);
                }
              }
            }
          }}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
      </div>

      {isLoading && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-900 dark:text-gray-100">
          Loading...
        </div>
      )}

      {result && !isLoading && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">
          {result}
        </div>
      )}
    </div>
  );
}
