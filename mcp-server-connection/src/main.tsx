import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useRegisterAction } from "@pulse-editor/react-api";
import { preRegisteredActions } from "../pregistered-actions";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const [mcpServerName, setMcpServerName] = useState<string>("");
  const [command, setCommand] = useState<string>("");
  const [args, setArgs] = useState<string[]>([]);
  const [currentArg, setCurrentArg] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [result, setResult] = useState<{
    [mcpServerName: string]: {
      command?: string;
      args?: string[];
      type?: string;
    };
  } | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  useRegisterAction(
    preRegisteredActions["config-mcp-server"],
    async (params) => {
      // If any field exists in args, use it to set the form state

      const updatedResult = {
        [params["mcp_server_name"] ?? mcpServerName ?? ""]: {
          command: params["command"] ?? command ?? "",
          args: params["args"] ?? args ?? [],
          type: params["type"] ?? type ?? "",
        },
      };

      setResult(updatedResult);
      setIsEditing(false);

      return {
        "mcp-config": updatedResult,
      };
    },
    [mcpServerName, command, args, type]
  );

  const addArg = () => {
    if (currentArg.trim()) {
      setArgs([...args, currentArg.trim()]);
      setCurrentArg("");
    }
  };

  const removeArg = (index: number) => {
    setArgs(args.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = {
      [mcpServerName]: {
        command: command,
        args: args,
        type: type,
      },
    };

    setResult(formData);
    setIsEditing(false);
    console.log("Form submitted:", formData);
  };

  return (
    <div className="p-2 flex flex-col">
      {result && !isEditing ? (
        <div className="w-full space-y-2">
          <h3 className="font-semibold text-lg mb-2">
            Added MCP Server Connection:
          </h3>
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
          <pre className="bg-gray-100 p-4 rounded overflow-auto dark:bg-gray-700">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : (
        <form className="space-y-4 w-full" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="mcp_server_name" className="font-semibold">
              MCP Server Name
            </label>
            <input
              id="mcp_server_name"
              type="text"
              value={mcpServerName}
              onChange={(e) => setMcpServerName(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter server name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="command" className="font-semibold">
              Command
            </label>
            <input
              id="command"
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter command"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="args" className="font-semibold">
              Args
            </label>
            <div className="flex gap-2">
              <input
                id="args"
                type="text"
                value={currentArg}
                onChange={(e) => setCurrentArg(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addArg())
                }
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                placeholder="Enter argument and press Add"
              />
              <button
                type="button"
                onClick={addArg}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Add
              </button>
            </div>
            {args.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {args.map((arg, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 px-3 py-1 rounded flex items-center gap-2 dark:bg-gray-700"
                  >
                    <span>{arg}</span>
                    <button
                      type="button"
                      onClick={() => removeArg(index)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="type" className="font-semibold">
              Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-500"
            >
              <option value="">Select type</option>
              <option value="stdio">stdio</option>
              <option value="sse">sse</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
}
