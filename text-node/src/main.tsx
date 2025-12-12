import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useRegisterAction } from "@pulse-editor/react-api";
import { preRegisteredActions } from "../pregistered-actions";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();

  const [input, setInput] = useState("");

  useRegisterAction(
    preRegisteredActions["input-text"],
    async (args) => {
      const text = args["text"] as string;
      setInput(text);
    },
    [setInput]
  );

  useRegisterAction(
    preRegisteredActions["output-text"],
    async () => {
      return { text: input };
    },
    [input]
  );

  useRegisterAction(
    preRegisteredActions["input-output-text"],
    async (args) => {
      const inputText = args["input-text"] as string;
      setInput(inputText);
      return { "output-text": inputText };
    },
    [setInput]
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
