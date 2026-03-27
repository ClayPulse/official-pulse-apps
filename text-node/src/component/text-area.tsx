import React, { useEffect } from "react";
import {
  useLoading,
  useActionEffect,
  useSnapshotState,
} from "@pulse-editor/react-api";

export function TextArea() {
  const { isReady, toggleLoading } = useLoading();

  const [input, setInput] = useSnapshotState("input", "");

  useActionEffect(
    {
      actionName: "input-text",
      beforeAction: async (args: { text?: string }) => {
        console.log("Received input-text action with input:", args.text);
        setInput(args.text ?? "");

        return args;
      },
    },
    [],
  );

  useActionEffect(
    {
      actionName: "output-text",
      // Output the text from UI to the action output
      afterAction: async () => {
        return { text: input };
      },
    },
    [input],
  );

  useActionEffect(
    {
      actionName: "input-output-text",
      beforeAction: async (args: { "input-text": string }) => {
        const argInput = args["input-text"]
          ? String(args["input-text"]).trim()
          : "";
        const text = argInput.length > 0 ? argInput : input;

        setInput(text);
        return {
          "input-text": text,
        };
      },
    },
    [input],
  );

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Make text input */}
      <textarea
        className="text-black bg-gray-100 dark:text-white dark:bg-gray-950 h-full w-full resize-none p-2 rounded-md"
        placeholder="Type something..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
    </div>
  );
}
