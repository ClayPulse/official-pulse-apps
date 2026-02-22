import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading } from "@pulse-editor/react-api";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  usePreRegisteredAction(preRegisteredActions["run-llm"], async (args) => {
    const prompt = args.prompt as string;
    // Call backend API to get LLM response
    const response = await fetch("/api/run-llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.text();
    return data;
  });

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
    </div>
  );
}
