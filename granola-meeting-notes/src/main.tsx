import React, { useEffect, useState, useCallback } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect, useOAuth } from "@pulse-editor/react-api";

// ── Constants ────────────────────────────────────────────────────────────────

const APP_ID = "granola_meeting_notes";
const OAUTH_PROVIDER = "granola";

// ── Types ───────────────────────────────────────────────────────────────────

type McpContent = { type: string; text?: string };
type McpResult = {
  result?: { content?: McpContent[] };
  error?: { message: string };
};

type View = "setup" | "list" | "detail";

type Meeting = {
  id: string;
  title: string;
  date: string;
  raw: string;
  snippet?: string[];
  participants?: string[];
};

// ── Component ───────────────────────────────────────────────────────────────

export default function Main() {
  const { isReady: isPulseReady, toggleLoading } = useLoading();
  const {
    isLoading: isOAuthLoading,
    isAuthenticated,
    connect,
    disconnect: clearOAuth,
  } = useOAuth(APP_ID, OAUTH_PROVIDER);

  const [view, setView] = useState<View>("setup");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<{
    note: string;
    transcript: string;
  } | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [includeTranscript, setIncludeTranscript] = useState(false);

  useEffect(() => {
    if (isPulseReady) toggleLoading(false);
  }, [isPulseReady, toggleLoading]);

  // ── Action effect for skill integration ─────────────────────────────────
  useActionEffect(
    {
      actionName: "export-notes",
      beforeAction: async (args: Record<string, unknown>) => {
        return args;
      },
    },
    [],
  );

  // ── OAuth login ─────────────────────────────────────────────────────────
  const startOAuth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // The editor handles everything: dynamic client registration, PKCE,
      // opening the authorization window, and token exchange + storage.
      await connect({
        provider: OAUTH_PROVIDER,
        authorizationUrl: "https://mcp-auth.granola.ai/oauth2/authorize",
        tokenEndpoint: "https://mcp-auth.granola.ai/oauth2/token",
        registrationEndpoint: "https://mcp-auth.granola.ai/oauth2/register",
        scope: "openid email profile offline_access",
      });

      setView("list");
    } catch {
      setError("Failed to start authentication");
    } finally {
      setLoading(false);
    }
  }, [connect]);

  // ── Fetch meetings ──────────────────────────────────────────────────────
  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/server-function/granola/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data: McpResult = await res.json();

      if (data.error) {
        if (res.status === 401) {
          await clearOAuth();
          setLoading(false);
          setView("setup");
          setError("Session expired. Please sign in again.");
          return;
        }
        setError(data.error.message || JSON.stringify(data.error));
        return;
      }

      const content = data.result?.content;
      if (!content?.length) {
        setMeetings([]);
        return;
      }

      const parsed = parseMeetingList(content);
      setMeetings(parsed);
      setView("list");
    } catch {
      setError("Failed to fetch meetings");
    } finally {
      setLoading(false);
    }
  }, [clearOAuth]);

  // ── Fetch single meeting ────────────────────────────────────────────────
  const fetchMeeting = useCallback(
    async (meetingId: string, title: string) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/server-function/granola/note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingId,
            includeTranscript,
          }),
        });
        const data = await res.json();

        if (data.error) {
          setError(
            typeof data.error === "string" ? data.error : data.error.message,
          );
          return;
        }

        const noteContent = extractTextContent(data.note);
        const transcriptContent = data.transcript
          ? extractTextContent(data.transcript)
          : "";

        setSelectedMeeting({
          note: noteContent,
          transcript: transcriptContent,
        });
        setSelectedTitle(title);
        setView("detail");
      } catch {
        setError("Failed to fetch meeting");
      } finally {
        setLoading(false);
      }
    },
    [includeTranscript],
  );

  // ── Copy as markdown ────────────────────────────────────────────────────
  const copyMarkdown = useCallback(() => {
    if (!selectedMeeting) return;
    const { summary } = parseNoteContent(selectedMeeting.note);
    let md = `# ${selectedTitle}\n\n${summary}`;
    if (selectedMeeting.transcript) {
      md += `\n\n## Transcript\n\n${selectedMeeting.transcript}`;
    }
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedMeeting, selectedTitle]);

  const disconnect = async () => {
    await clearOAuth();
    setMeetings([]);
    setSelectedMeeting(null);
    setLoading(false);
    setError("");
    setView("setup");
  };

  // Auto-fetch once OAuth loads and user is authenticated
  useEffect(() => {
    if (!isOAuthLoading && isAuthenticated && meetings.length === 0) {
      fetchMeetings();
    }
  }, [isOAuthLoading, isAuthenticated]);

  return (
    <div className="flex flex-col w-full h-full bg-[#fafafa] text-gray-900 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          {view === "detail" && (
            <button
              onClick={() => setView("list")}
              className="p-1 -ml-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Back"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 12L6 8l4-4" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="font-semibold text-[15px] leading-tight">
              {view === "detail" ? selectedTitle : "Granola Notes"}
            </h1>
            {view === "list" && meetings.length > 0 && (
              <span className="text-[11px] text-gray-400">
                {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {view === "list" && (
            <button
              onClick={() => fetchMeetings()}
              disabled={loading}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 transition-colors"
              aria-label="Refresh"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={loading ? "animate-spin" : ""}
              >
                <path d="M1.5 8a6.5 6.5 0 0 1 11.25-4.5M14.5 8a6.5 6.5 0 0 1-11.25 4.5" />
                <path d="M13.5 2v3.5H10M2.5 14v-3.5H6" />
              </svg>
            </button>
          )}
          {view === "detail" && (
            <button
              onClick={copyMarkdown}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                copied
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
            >
              {copied ? (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="5" y="5" width="9" height="9" rx="1.5" />
                    <path d="M2 11V2.5A.5.5 0 0 1 2.5 2H11" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
          {view !== "setup" && (
            <button
              onClick={disconnect}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Disconnect"
              title="Disconnect from Granola"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6M10.5 11.5L14 8l-3.5-3.5M6 8h8" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Loading bar */}
      {loading && (
        <div className="h-[2px] bg-gray-100 overflow-hidden">
          <div className="h-full w-1/3 bg-gray-900 rounded-full animate-[shimmer_1s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="mx-3 mt-3 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs flex items-start gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mt-px shrink-0"
          >
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v3.5M8 10.5v.5" strokeLinecap="round" />
          </svg>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600 shrink-0"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      )}

      {/* OAuth initializing — loading spinner */}
      {isOAuthLoading && view === "setup" && (
        <div className="flex-1 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="animate-spin text-gray-300"
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              strokeDasharray="30"
              strokeDashoffset="10"
            />
          </svg>
        </div>
      )}

      {/* Setup view — OAuth login */}
      {!isOAuthLoading && view === "setup" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16v16H4z" />
              <path d="M8 8h8M8 12h6M8 16h4" />
            </svg>
          </div>
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-semibold">Connect to Granola</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Sign in to access your meeting notes,
              <br />
              summaries, and transcripts.
            </p>
          </div>
          <button
            onClick={startOAuth}
            disabled={loading}
            className="w-full max-w-[240px] py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="animate-spin"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    strokeDasharray="30"
                    strokeDashoffset="10"
                  />
                </svg>
                Connecting...
              </span>
            ) : (
              "Sign in with Granola"
            )}
          </button>
          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            Free: last 30 days &middot; Paid: full access + transcripts
          </p>
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Options bar */}
          <div className="flex items-center px-4 py-2 border-b border-gray-100 bg-white">
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeTranscript}
                onChange={(e) => setIncludeTranscript(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 focus:ring-offset-0 cursor-pointer"
              />
              Include transcripts
            </label>
          </div>

          <div className="flex-1 overflow-auto">
            {meetings.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-300"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M8 8h8M8 12h6M8 16h4" />
                </svg>
                <span className="text-xs">No meetings found</span>
              </div>
            )}
            <div className="px-3 py-2 space-y-1">
              {meetings.map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => fetchMeeting(meeting.id, meeting.title)}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[13px] truncate group-hover:text-gray-900">
                        {meeting.title || "Untitled"}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {meeting.date && (
                          <span className="text-[11px] text-gray-400">
                            {meeting.date}
                          </span>
                        )}
                        {meeting.participants &&
                          meeting.participants.length > 0 && (
                            <span className="text-[11px] text-gray-400">
                              &middot; {meeting.participants.length} participant
                              {meeting.participants.length !== 1 ? "s" : ""}
                            </span>
                          )}
                      </div>
                      {meeting.snippet && meeting.snippet.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {meeting.snippet.map((s, i) => (
                            <span
                              key={i}
                              className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-md leading-tight"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-300 group-hover:text-gray-500 mt-0.5 shrink-0 transition-colors"
                    >
                      <path d="M6 4l4 4-4 4" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail view */}
      {view === "detail" && selectedMeeting && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="px-4 py-4">
              {(() => {
                const { participants, summary } = parseNoteContent(
                  selectedMeeting.note,
                );
                return (
                  <>
                    {participants.length > 0 && (
                      <div className="mb-4 pb-3 border-b border-gray-100">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                          Participants
                        </div>
                        <div className="space-y-0.5">
                          {participants.map((p, i) => (
                            <div
                              key={i}
                              className="text-[12px] text-gray-500 leading-relaxed"
                            >
                              {p}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <MarkdownNote content={summary} />
                  </>
                );
              })()}
              {selectedMeeting.transcript && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Transcript
                  </h3>
                  <div className="text-xs whitespace-pre-wrap text-gray-600 leading-relaxed">
                    {selectedMeeting.transcript}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseNoteContent(raw: string): {
  participants: string[];
  summary: string;
} {
  const summaryMatch = raw.match(/<summary>([\s\S]*?)<\/summary>/);
  const summary = summaryMatch ? summaryMatch[1].trim() : raw;

  const participantsMatch = raw.match(
    /<known_participants>([\s\S]*?)<\/known_participants>/,
  );
  const participants = participantsMatch
    ? participantsMatch[1]
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

  return { participants, summary };
}

function MarkdownNote({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      nodes.push(
        <h3
          key={`h-${i}`}
          className="font-semibold text-[13px] text-gray-800 mt-5 first:mt-0 mb-2"
        >
          {line.slice(4)}
        </h3>,
      );
      i++;
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items: { text: string; sub: string[] }[] = [];
      while (i < lines.length) {
        const l = lines[i];
        if (/^-\s+/.test(l)) {
          items.push({ text: l.replace(/^-\s+/, ""), sub: [] });
          i++;
        } else if (/^\s{2,}-\s+/.test(l)) {
          if (items.length > 0)
            items[items.length - 1].sub.push(l.replace(/^\s+-\s+/, ""));
          i++;
        } else if (l.trim() === "") {
          i++;
          break;
        } else {
          break;
        }
      }
      nodes.push(
        <ul key={`ul-${i}`} className="mb-3 space-y-1.5">
          {items.map((item, j) => (
            <li
              key={j}
              className="flex gap-2 text-[13px] text-gray-700 leading-relaxed"
            >
              <span className="mt-1.75 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
              <span>
                {item.text}
                {item.sub.length > 0 && (
                  <ul className="mt-1 space-y-1">
                    {item.sub.map((s, k) => (
                      <li
                        key={k}
                        className="flex gap-2 text-[12px] text-gray-500 leading-relaxed"
                      >
                        <span className="mt-1.25 w-1 h-1 rounded-full bg-gray-200 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    nodes.push(
      <p
        key={`p-${i}`}
        className="text-[13px] text-gray-700 leading-relaxed mb-2"
      >
        {line}
      </p>,
    );
    i++;
  }

  return <>{nodes}</>;
}

function extractTextContent(mcpResponse: McpResult): string {
  const content = mcpResponse.result?.content;
  if (!content?.length) return "";
  return content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text!)
    .join("\n\n");
}

function parseMeetingList(content: McpContent[]): Meeting[] {
  const text = content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text!)
    .join("\n");

  const meetings: Meeting[] = [];

  // Try to parse XML meeting elements
  const meetingTagPattern = /<meeting\s([^>]*)>([\s\S]*?)<\/meeting>/g;
  let match: RegExpExecArray | null;
  while ((match = meetingTagPattern.exec(text)) !== null) {
    const attrs = match[1];
    const body = match[2];

    const id = (attrs.match(/id="([^"]+)"/) || [])[1] || "";
    const title = (attrs.match(/title="([^"]+)"/) || [])[1] || "Untitled";
    const date = (attrs.match(/date="([^"]+)"/) || [])[1] || "";

    const participantsMatch = body.match(
      /<known_participants>([\s\S]*?)<\/known_participants>/,
    );
    const participants = participantsMatch
      ? participantsMatch[1]
          .trim()
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
      : [];

    const summaryMatch = body.match(/<summary>([\s\S]*?)<\/summary>/);
    const summaryText = summaryMatch ? summaryMatch[1] : "";
    const snippet = summaryText
      .split("\n")
      .filter((l) => l.startsWith("### "))
      .map((l) => l.slice(4).trim())
      .slice(0, 3);

    meetings.push({ id, title, date, raw: match[0], snippet, participants });
  }
  if (meetings.length > 0) return meetings;

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      for (const m of parsed) {
        meetings.push({
          id: m.id || m.meeting_id || "",
          title: m.title || m.name || "Untitled",
          date: m.date || m.created_at || "",
          raw: JSON.stringify(m),
        });
      }
      return meetings;
    }
  } catch {
    // Not JSON, parse as text
  }

  const lines = text.split("\n").filter((l) => l.trim());
  const idPattern = /\b(not_[a-zA-Z0-9]{14}|[a-f0-9-]{36})\b/;

  for (const line of lines) {
    const idMatch = line.match(idPattern);
    if (idMatch) {
      const id = idMatch[1];
      const title =
        line
          .replace(idMatch[0], "")
          .replace(/[-|:[\]()]/g, " ")
          .trim() || "Untitled";
      meetings.push({ id, title, date: "", raw: line });
    }
  }

  if (meetings.length === 0 && text.trim()) {
    meetings.push({ id: "raw", title: "Meeting Notes", date: "", raw: text });
  }

  return meetings;
}
