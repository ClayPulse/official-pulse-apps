import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";
import applyTemplate from "./skill/apply-template/action";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const [templateInput, setTemplateInput] = useState<string>("");
  const [variablesInput, setVariablesInput] = useState<string>("");
  const [templateResult, setTemplateResult] = useState<string>("");

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  useActionEffect(
    {
      actionName: "apply-template",
      beforeAction: async (args: any) => {
        setTemplateInput(args.template || "");
        setVariablesInput(JSON.stringify(args.variables || {}));
        return args;
      },
      afterAction: async (result: any) => {
        setTemplateResult(result.result || "");
        return result;
      },
    },
    [],
  );

  return (
    <div className="p-2 flex flex-col w-full h-full overflow-auto gap-y-1">
      <div className="flex flex-col gap-y-1">
        <label className="font-bold">Prompt Template</label>
        <textarea
          className="border-2 border-gray-300 rounded-sm p-2"
          rows={3}
          placeholder="Hello {name}, welcome to {place}"
          value={templateInput}
          onChange={(e) => setTemplateInput(e.target.value)}
        />
        <label className="font-bold">Variables (JSON)</label>
        <textarea
          className="border-2 border-gray-300 rounded-sm p-2"
          rows={2}
          placeholder='{"name": "Alice", "place": "Wonderland"}'
          value={variablesInput}
          onChange={(e) => setVariablesInput(e.target.value)}
        />
        <button
          className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-sm"
          onClick={() => {
            try {
              const variables = JSON.parse(variablesInput);
              const result = applyTemplate({ template: templateInput, variables });
              setTemplateResult(result.result);
            } catch {
              setTemplateResult("Error: invalid JSON in variables");
            }
          }}
        >
          Apply Template
        </button>
        {templateResult && <p className="text-blue-400">{templateResult}</p>}
      </div>
    </div>
  );
}
