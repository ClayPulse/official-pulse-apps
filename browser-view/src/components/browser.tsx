import React, { useState } from "react";
import { useRegisterAction, useWorkspaceInfo } from "@pulse-editor/react-api";
import { preRegisteredActions } from "../../preregistered-actions";

export default function Browser() {
  const { workspaceId } = useWorkspaceInfo();

  const [uri, setUri] = useState("");

  // Register command
  useRegisterAction(
    preRegisteredActions["web-browse"],
    async ({ url }: { url: string }) => {
      setUri(() => encodeURIComponent(url));
      return;
    },
    [uri]
  );

  useRegisterAction(
    preRegisteredActions["pulse-app-dev-preview"],
    async () => {
      setUri(() =>
        workspaceId ? `https://${workspaceId}.workspace.pulse-editor.com` : ""
      );
    },
    [workspaceId]
  );

  return (
    <div className="w-full h-full p-2 flex flex-col">
      <div className="grid grid-rows-[max-content_auto] gap-2 h-full">
        {/* Simple address bar */}
        <div className="w-full flex space-x-2">
          <input
            type="text"
            className="flex-grow border border-gray-300 rounded-sm px-2 py-1"
            placeholder="Enter URL"
            value={uri !== "" ? decodeURIComponent(uri) : ""}
            onChange={(e) => setUri(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setUri(encodeURIComponent(e.currentTarget.value));
              }
            }}
          />
        </div>
        <div className="w-full h-full rounded-sm overflow-hidden">
          {uri !== "" ? (
            <iframe
              className="w-full h-full"
              title="proxy-frame"
              src={decodeURIComponent(uri)}
              style={{ width: "100%", height: "90vh", border: "none" }}
            ></iframe>
          ) : (
            // Make a simple welcome page and input to enter URL
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              <h1 className="text-2xl font-bold">Welcome to Browser View</h1>
              <p className="text-center text-gray-600">
                Enter a URL in the address bar to start browsing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
