import React, { useEffect } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  useActionEffect(
    {
      actionName: "parse-json",
      beforeAction: async (input) => input,
      afterAction: async (output) => output,
    },
    []
  );

  useActionEffect(
    {
      actionName: "stringify-json",
      beforeAction: async (input) => input,
      afterAction: async (output) => output,
    },
    []
  );

  return (
    <div className="p-2 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Pulse App JSON Utils</h1>
      <p>Select an action to get started.</p>
      <div>
        Available Utils:
        <ul className="list-disc list-inside">
          <li>Parse JSON string to JSON object</li>
          <li>Stringify JSON object to JSON string</li>
        </ul>
      </div>
    </div>
  );
}
