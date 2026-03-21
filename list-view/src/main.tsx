import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

type TaskItem = {
  type?: string;
  name?: string;
  description?: string;
  status?: string;
  url?: string;
  [key: string]: unknown;
};

const TYPE_ICONS: Record<string, string> = {
  document: "📄",
  todo: "☑️",
  image: "🖼️",
  "email-draft": "✉️",
  email: "✉️",
  pdf: "📄",
  spreadsheet: "📊",
  video: "🎬",
  link: "🔗",
};

function getIcon(type?: string): string {
  if (!type) return "📋";
  return TYPE_ICONS[type.toLowerCase()] ?? "📋";
}

function formatKey(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function TaskCard({ item, index }: { item: TaskItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const icon = getIcon(item.type);
  const extraKeys = Object.keys(item).filter(
    (k) => !["type", "name", "description", "status", "url"].includes(k),
  );

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div
        className="flex items-start gap-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xl mt-0.5 shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
              {item.name || `Item ${index + 1}`}
            </span>
            {item.type && (
              <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded shrink-0">
                {item.type}
              </span>
            )}
            {item.status && (
              <span className="text-[10px] uppercase tracking-wider text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded shrink-0">
                {item.status}
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        <span className="text-gray-400 text-xs mt-1 shrink-0">
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 ml-9 text-xs space-y-1.5">
          {item.url && (
            <div className="flex gap-2">
              <span className="text-gray-400 shrink-0">URL:</span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline truncate"
              >
                {item.url}
              </a>
            </div>
          )}
          {extraKeys.map((key) => (
            <div key={key} className="flex gap-2">
              <span className="text-gray-400 shrink-0">{formatKey(key)}:</span>
              <span className="text-gray-600 dark:text-gray-300 truncate">
                {typeof item[key] === "object"
                  ? JSON.stringify(item[key])
                  : String(item[key])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const [items, setItems] = useState<TaskItem[]>([]);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  const { runAppAction } = useActionEffect(
    {
      actionName: "review-tasks",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeAction: async (args: any) => {
        if (!args) return;
        setItems(args.items || []);
        setApproved(false);
        return args;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      afterAction: async (result: any) => {
        setApproved(true);
        return result;
      },
    },
    [],
  );

  const isEmpty = items.length === 0;

  return (
    <div className="flex flex-col w-full h-full overflow-hidden text-gray-800 dark:text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <h1 className="text-sm font-semibold">Task Review</h1>
          {!isEmpty && (
            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        {approved && (
          <span className="text-[10px] uppercase tracking-wider text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full font-medium">
            Approved
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-2">
            <span className="text-3xl">📭</span>
            <p className="text-sm">No tasks to review</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 text-center max-w-[200px]">
              Tasks will appear here when an agent or workflow sends items for
              your review.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <TaskCard key={i} item={item} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Footer with action button */}
      {!isEmpty && !approved && (
        <div className="shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            onClick={async () => {
              if (runAppAction) {
                await runAppAction({ items });
                setApproved(true);
              }
            }}
          >
            Approve {items.length} {items.length === 1 ? "item" : "items"}
          </button>
        </div>
      )}
    </div>
  );
}
