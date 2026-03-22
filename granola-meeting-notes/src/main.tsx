import React, { useEffect, useState, useCallback, useRef } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

// ── OAuth helpers ───────────────────────────────────────────────────────────

const AUTH_ENDPOINT = "https://mcp-auth.granola.ai/oauth2/authorize";
const STORAGE_KEYS = {
  accessToken: "granola_access_token",
  refreshToken: "granola_refresh_token",
  clientId: "granola_client_id",
  expiresAt: "granola_expires_at",
};

function generateRandomString(length: number) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function getStoredAuth() {
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
  const expiresAt = localStorage.getItem(STORAGE_KEYS.expiresAt);
  if (accessToken && expiresAt && Date.now() < Number(expiresAt)) {
    return accessToken;
  }
  return null;
}

function storeAuth(data: { access_token: string; refresh_token?: string; expires_in?: number }, clientId: string) {
  localStorage.setItem(STORAGE_KEYS.accessToken, data.access_token);
  localStorage.setItem(STORAGE_KEYS.clientId, clientId);
  if (data.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, data.refresh_token);
  }
  if (data.expires_in) {
    localStorage.setItem(STORAGE_KEYS.expiresAt, String(Date.now() + data.expires_in * 1000));
  }
}

function clearAuth() {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}

// ── Types ───────────────────────────────────────────────────────────────────

type McpContent = { type: string; text?: string };
type McpResult = { result?: { content?: McpContent[] }; error?: { message: string } };

type View = "setup" | "list" | "detail";

type Meeting = {
  id: string;
  title: string;
  date: string;
  raw: string;
};

// ── Component ───────────────────────────────────────────────────────────────

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const [view, setView] = useState<View>(() => (getStoredAuth() ? "list" : "setup"));
  const [accessToken, setAccessToken] = useState(() => getStoredAuth() || "");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<{ note: string; transcript: string } | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [includeTranscript, setIncludeTranscript] = useState(false);
  const authWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    if (isReady) toggleLoading(false);
  }, [isReady, toggleLoading]);

  // ── Action effect for skill integration ─────────────────────────────────
  const { runAppAction } = useActionEffect(
    {
      actionName: "export-notes",
      beforeAction: async (args: Record<string, unknown>) => {
        return args;
      },
      afterAction: async (result: Record<string, unknown>) => {
        if (!result) return;
        if (result.success && result.markdown) {
          await navigator.clipboard.writeText(result.markdown as string);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
        return result;
      },
    },
    [],
  );

  // ── OAuth callback listener ─────────────────────────────────────────────
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type !== "granola-oauth-callback") return;
      const { code, state } = event.data;
      const storedState = sessionStorage.getItem("granola_oauth_state");
      const codeVerifier = sessionStorage.getItem("granola_code_verifier");
      const clientId = localStorage.getItem(STORAGE_KEYS.clientId);

      if (!code || state !== storedState || !codeVerifier || !clientId) {
        setError("OAuth callback validation failed");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/server-function/granola/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "token",
            code,
            redirectUri: getRedirectUri(),
            clientId,
            codeVerifier,
          }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          return;
        }
        storeAuth(data, clientId);
        setAccessToken(data.access_token);
        setView("list");
        sessionStorage.removeItem("granola_oauth_state");
        sessionStorage.removeItem("granola_code_verifier");
      } catch {
        setError("Token exchange failed");
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // ── Check URL for OAuth redirect (fallback for same-window redirect) ────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code && state) {
      // Post to self so the message handler picks it up
      window.postMessage({ type: "granola-oauth-callback", code, state }, "*");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  function getRedirectUri() {
    return window.location.origin + window.location.pathname;
  }

  // ── OAuth login ─────────────────────────────────────────────────────────
  const startOAuth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Step 1: Dynamic client registration
      const regRes = await fetch("/server-function/granola/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", redirectUri: getRedirectUri() }),
      });
      const regData = await regRes.json();
      if (regData.error) {
        setError(regData.error);
        setLoading(false);
        return;
      }
      localStorage.setItem(STORAGE_KEYS.clientId, regData.client_id);

      // Step 2: Generate PKCE values
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(16);

      sessionStorage.setItem("granola_code_verifier", codeVerifier);
      sessionStorage.setItem("granola_oauth_state", state);

      // Step 3: Open authorization URL
      const authUrl = new URL(AUTH_ENDPOINT);
      authUrl.searchParams.set("client_id", regData.client_id);
      authUrl.searchParams.set("redirect_uri", getRedirectUri());
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid email profile offline_access");
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");

      // Try popup first, fall back to redirect
      const popup = window.open(authUrl.toString(), "granola-auth", "width=500,height=700");
      if (popup) {
        authWindowRef.current = popup;
      } else {
        window.location.href = authUrl.toString();
      }
    } catch {
      setError("Failed to start authentication");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Refresh token ───────────────────────────────────────────────────────
  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    const clientId = localStorage.getItem(STORAGE_KEYS.clientId);
    if (!refreshToken || !clientId) return null;

    const res = await fetch("/server-function/granola/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "refresh", refreshToken, clientId }),
    });
    const data = await res.json();
    if (data.error) return null;
    storeAuth(data, clientId);
    setAccessToken(data.access_token);
    return data.access_token;
  }, []);

  const getValidToken = useCallback(async () => {
    const stored = getStoredAuth();
    if (stored) return stored;
    return refreshAccessToken();
  }, [refreshAccessToken]);

  // ── Fetch meetings ──────────────────────────────────────────────────────
  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getValidToken();
      if (!token) {
        setLoading(false);
        setView("setup");
        return;
      }

      const res = await fetch("/server-function/granola/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token }),
      });
      const data: McpResult = await res.json();

      if (data.error) {
        if (res.status === 401) {
          clearAuth();
          setAccessToken("");
          setLoading(false);
          setView("setup");
          setError("Session expired. Please sign in again.");
          return;
        }
        setError(data.error.message || JSON.stringify(data.error));
        return;
      }

      // Parse MCP response — content is an array of text blocks
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
  }, [getValidToken]);

  // ── Fetch single meeting ────────────────────────────────────────────────
  const fetchMeeting = useCallback(
    async (meetingId: string, title: string) => {
      setLoading(true);
      setError("");
      try {
        const token = await getValidToken();
        if (!token) {
          setLoading(false);
          setView("setup");
          return;
        }

        const res = await fetch("/server-function/granola/note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: token, meetingId, includeTranscript }),
        });
        const data = await res.json();

        if (data.error) {
          setError(typeof data.error === "string" ? data.error : data.error.message);
          return;
        }

        const noteContent = extractTextContent(data.note);
        const transcriptContent = data.transcript ? extractTextContent(data.transcript) : "";

        setSelectedMeeting({ note: noteContent, transcript: transcriptContent });
        setSelectedTitle(title);
        setView("detail");
      } catch {
        setError("Failed to fetch meeting");
      } finally {
        setLoading(false);
      }
    },
    [getValidToken, includeTranscript],
  );

  // ── Copy as markdown ────────────────────────────────────────────────────
  const copyMarkdown = useCallback(() => {
    if (!selectedMeeting) return;
    let md = `# ${selectedTitle}\n\n${selectedMeeting.note}`;
    if (selectedMeeting.transcript) {
      md += `\n\n## Transcript\n\n${selectedMeeting.transcript}`;
    }
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedMeeting, selectedTitle]);

  const disconnect = () => {
    clearAuth();
    setAccessToken("");
    setMeetings([]);
    setSelectedMeeting(null);
    setLoading(false);
    setError("");
    setView("setup");
  };

  // Auto-fetch on mount if authenticated
  useEffect(() => {
    if (accessToken && view === "list" && meetings.length === 0) {
      fetchMeetings();
    }
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

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
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="font-semibold text-[15px] leading-tight">
              {view === "detail" ? selectedTitle : "Granola Notes"}
            </h1>
            {view === "list" && meetings.length > 0 && (
              <span className="text-[11px] text-gray-400">{meetings.length} meeting{meetings.length !== 1 ? "s" : ""}</span>
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
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}>
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
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M2 11V2.5A.5.5 0 0 1 2.5 2H11" /></svg>
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
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-px shrink-0">
            <circle cx="8" cy="8" r="6.5" /><path d="M8 5v3.5M8 10.5v.5" strokeLinecap="round" />
          </svg>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 shrink-0">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>
      )}

      {/* Setup view — OAuth login */}
      {view === "setup" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h6M8 16h4" />
            </svg>
          </div>
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-semibold">Connect to Granola</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Sign in to access your meeting notes,<br />summaries, and transcripts.
            </p>
          </div>
          <button
            onClick={startOAuth}
            disabled={loading}
            className="w-full max-w-[240px] py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-spin"><circle cx="8" cy="8" r="6" strokeDasharray="30" strokeDashoffset="10" /></svg>
                Connecting...
              </span>
            ) : "Sign in with Granola"}
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
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                  <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 8h8M8 12h6M8 16h4" />
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
                      {meeting.date && (
                        <div className="text-[11px] text-gray-400 mt-0.5">{meeting.date}</div>
                      )}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-gray-500 mt-0.5 shrink-0 transition-colors">
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
            <div className="px-4 py-4 space-y-4">
              <div className="prose prose-sm max-w-none text-[13px] leading-relaxed whitespace-pre-wrap text-gray-800">
                {selectedMeeting.note}
              </div>
              {selectedMeeting.transcript && (
                <div className="border-t border-gray-100 pt-4">
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

  // The MCP list_meetings tool returns structured text — parse meeting entries
  const meetings: Meeting[] = [];
  // Try to parse as JSON first
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

  // Fallback: parse line-based format
  // Common patterns: "- Title (date) [id]" or similar
  const lines = text.split("\n").filter((l) => l.trim());
  const idPattern = /\b(not_[a-zA-Z0-9]{14}|[a-f0-9-]{36})\b/;

  for (const line of lines) {
    const idMatch = line.match(idPattern);
    if (idMatch) {
      const id = idMatch[1];
      const title = line.replace(idMatch[0], "").replace(/[-|:[\]()]/g, " ").trim() || "Untitled";
      meetings.push({ id, title, date: "", raw: line });
    }
  }

  // If no IDs found, just show the text as a single block
  if (meetings.length === 0 && text.trim()) {
    meetings.push({ id: "raw", title: "Meeting Notes", date: "", raw: text });
  }

  return meetings;
}
