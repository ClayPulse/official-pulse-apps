import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

type NotionPage = {
  id: string;
  type?: string;
  child_page?: { title: string };
  properties?: { title?: { title?: { plain_text: string }[] } };
  url?: string;
};

function getPageTitle(page: NotionPage): string {
  if (page.child_page?.title) return page.child_page.title;
  const titleProp = page.properties?.title?.title;
  if (titleProp && titleProp.length > 0) return titleProp[0].plain_text;
  return "Untitled";
}

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const [token, setToken] = useState("");
  const [pageId, setPageId] = useState("");

  // Read state
  const [readResult, setReadResult] = useState<string>("");
  const [readLoading, setReadLoading] = useState(false);

  // Write state
  const [writeContent, setWriteContent] = useState("");
  const [writeTitle, setWriteTitle] = useState("");
  const [writeMode, setWriteMode] = useState<"append" | "create">("append");
  const [writeParentId, setWriteParentId] = useState("");
  const [writeResult, setWriteResult] = useState("");
  const [writeLoading, setWriteLoading] = useState(false);

  // List state
  const [listParentId, setListParentId] = useState("");
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Active tab
  const [tab, setTab] = useState<"read" | "write" | "list">("list");

  useEffect(() => {
    if (isReady) toggleLoading(false);
  }, [isReady, toggleLoading]);

  // Register action effects for all 3 skills
  const { runAppAction: runRead } = useActionEffect(
    {
      actionName: "readNotionContent",
      beforeAction: async (args: any) => args,
      afterAction: async (result: any) => {
        if (result && !result.error) {
          setReadResult(JSON.stringify(result, null, 2));
        }
        return result;
      },
    },
    [],
  );

  const { runAppAction: runWrite } = useActionEffect(
    {
      actionName: "writeNotionContent",
      beforeAction: async (args: any) => args,
      afterAction: async (result: any) => {
        if (result) setWriteResult(JSON.stringify(result, null, 2));
        return result;
      },
    },
    [],
  );

  const { runAppAction: runList } = useActionEffect(
    {
      actionName: "listNotionPages",
      beforeAction: async (args: any) => args,
      afterAction: async (result: any) => {
        if (result?.pages) setPages(result.pages);
        return result;
      },
    },
    [],
  );

  async function handleRead() {
    if (!token || !pageId) return;
    setReadLoading(true);
    setReadResult("");
    try {
      const result = await runRead!({ pageId, notionToken: token });
      if (result) setReadResult(JSON.stringify(result, null, 2));
    } finally {
      setReadLoading(false);
    }
  }

  async function handleWrite() {
    if (!token || !writeContent) return;
    setWriteLoading(true);
    setWriteResult("");
    try {
      const args: any =
        writeMode === "append"
          ? { notionToken: token, content: writeContent, pageId }
          : {
              notionToken: token,
              content: writeContent,
              parentId: writeParentId,
              title: writeTitle,
            };
      const result = await runWrite!(args);
      if (result) setWriteResult(JSON.stringify(result, null, 2));
    } finally {
      setWriteLoading(false);
    }
  }

  async function handleList() {
    if (!token) return;
    setListLoading(true);
    setPages([]);
    try {
      const result = await runList!({
        notionToken: token,
        pageId: listParentId || undefined,
      });
      if (result?.pages) setPages(result.pages);
    } finally {
      setListLoading(false);
    }
  }

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? "bg-indigo-600 text-white"
        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
    }`;

  return (
    <div className="flex flex-col w-full h-full overflow-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-6 gap-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Notion Integration
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Read, write, and browse your Notion workspace
        </p>
      </div>

      {/* Token input */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-2">
        <label className="text-xs uppercase tracking-wider text-gray-500">
          Notion API Token
        </label>
        <input
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          type="password"
          placeholder="ntn_..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button className={tabClass("list")} onClick={() => setTab("list")}>
          List Pages
        </button>
        <button className={tabClass("read")} onClick={() => setTab("read")}>
          Read
        </button>
        <button className={tabClass("write")} onClick={() => setTab("write")}>
          Write
        </button>
      </div>

      {/* List Tab */}
      {tab === "list" && (
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
          <label className="text-xs uppercase tracking-wider text-gray-500">
            Parent Page ID (optional)
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              type="text"
              placeholder="Leave empty for all pages"
              value={listParentId}
              onChange={(e) => setListParentId(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              onClick={handleList}
              disabled={!token || listLoading}
            >
              {listLoading ? "Loading..." : "List"}
            </button>
          </div>
          {pages.length > 0 && (
            <div className="space-y-1 max-h-64 overflow-auto">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => {
                    setPageId(page.id);
                    setTab("read");
                  }}
                >
                  <span className="text-gray-200 truncate">
                    {getPageTitle(page)}
                  </span>
                  <span className="text-[10px] text-gray-500 ml-2 shrink-0 font-mono">
                    {page.id.slice(0, 8)}...
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Read Tab */}
      {tab === "read" && (
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
          <label className="text-xs uppercase tracking-wider text-gray-500">
            Page ID
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              type="text"
              placeholder="Notion page ID"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              onClick={handleRead}
              disabled={!token || !pageId || readLoading}
            >
              {readLoading ? "Loading..." : "Read"}
            </button>
          </div>
          {readResult && (
            <pre className="rounded-lg bg-white/5 px-3 py-2 text-xs text-indigo-300 font-mono overflow-auto max-h-64 whitespace-pre-wrap">
              {readResult}
            </pre>
          )}
        </div>
      )}

      {/* Write Tab */}
      {tab === "write" && (
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 text-xs rounded-md transition-colors ${writeMode === "append" ? "bg-indigo-600 text-white" : "bg-white/5 text-gray-400"}`}
              onClick={() => setWriteMode("append")}
            >
              Append to Page
            </button>
            <button
              className={`px-3 py-1 text-xs rounded-md transition-colors ${writeMode === "create" ? "bg-indigo-600 text-white" : "bg-white/5 text-gray-400"}`}
              onClick={() => setWriteMode("create")}
            >
              Create New Page
            </button>
          </div>

          {writeMode === "append" ? (
            <>
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Page ID
              </label>
              <input
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                type="text"
                placeholder="Page ID to append to"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
              />
            </>
          ) : (
            <>
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Parent Page ID
              </label>
              <input
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                type="text"
                placeholder="Parent page ID"
                value={writeParentId}
                onChange={(e) => setWriteParentId(e.target.value)}
              />
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Title
              </label>
              <input
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                type="text"
                placeholder="New page title"
                value={writeTitle}
                onChange={(e) => setWriteTitle(e.target.value)}
              />
            </>
          )}

          <label className="text-xs uppercase tracking-wider text-gray-500">
            Content
          </label>
          <textarea
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[80px] resize-y"
            placeholder="Content to write (each line becomes a paragraph)"
            value={writeContent}
            onChange={(e) => setWriteContent(e.target.value)}
          />
          <button
            className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
            onClick={handleWrite}
            disabled={!token || !writeContent || writeLoading}
          >
            {writeLoading ? "Writing..." : writeMode === "append" ? "Append Content" : "Create Page"}
          </button>
          {writeResult && (
            <pre className="rounded-lg bg-white/5 px-3 py-2 text-xs text-green-300 font-mono overflow-auto max-h-48 whitespace-pre-wrap">
              {writeResult}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
