import React, { useEffect, useState } from "react";
import "./tailwind.css";
import {
  useLoading,
  useNotification,
  useRegisterAction,
  useWorkspaceInfo,
} from "@pulse-editor/react-api";
import { preRegisteredActions } from "../preregistered-actions";
import { NotificationTypeEnum } from "@pulse-editor/shared-utils";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const { workspaceId } = useWorkspaceInfo();
  const { openNotification } = useNotification();

  const [uri, setUri] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);
  useRegisterAction(
    preRegisteredActions["pulse-app-dev-preview"],
    async () => {
      setUri(() =>
        workspaceId ? `https://${workspaceId}.workspace.pulse-editor.com` : ""
      );
      setReloadKey((k) => k + 1);
    },
    [workspaceId]
  );

  return (
    <div className="w-full h-full">
      <div className="w-full h-full rounded-sm overflow-hidden">
        {uri !== "" ? (
          <iframe
            className="w-full h-full"
            title="proxy-frame"
            src={decodeURIComponent(uri)}
            key={reloadKey}
          ></iframe>
        ) : (
          // Make a simple welcome page and input to enter URL
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
            <p className="text-center text-gray-600">
              Preview the Pulse App during development. Run the &quot;Pulse App
              Dev Preview&quot; action to load the app here.
            </p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => {
                if (!workspaceId) {
                  openNotification(
                    "Workspace ID is not available. Are you in a workspace?",
                    NotificationTypeEnum.Warning
                  );
                  return;
                }
                setUri(`https://${workspaceId}.workspace.pulse-editor.com`);
                setReloadKey((k) => k + 1);
              }}
            >
              Load from workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
