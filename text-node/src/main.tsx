import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();

  const [input, setInput] = useState("");

  useActionEffect(
    {
      actionName: "inputText",
      beforeAction: async (args: { text?: string }) => {
        console.log("Received inputText action with input:", args.text);
        setInput(args.text ?? "");

        return args;
      },
    },
    [setInput],
  );

  useActionEffect(
    {
      actionName: "outputText",
      // Output the text from UI to the action output
      afterAction: async () => {
        return { text: input };
      },
    },
    [input],
  );

  useActionEffect(
    {
      actionName: "inputOutputText",
      beforeAction: async (args: { [x: string]: string }) => {
        const inputText = args["input-text"] ?? "";
        setInput(inputText);
        return args;
      },
      afterAction(result) {
        return result;
      },
    },
    [setInput],
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
