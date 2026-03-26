import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect, useOAuth } from "@pulse-editor/react-api";

const APP_ID = "email_sender";
const OAUTH_PROVIDER = "gmail";

type Mode = "managed" | "byok" | "gmail";
type Tab = "send" | "domains" | "inbox";
type EmailSummary = {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  isUnread: boolean;
};
type EmailDetail = EmailSummary & {
  body: { html: string; text: string };
};
type Domain = {
  id: string;
  name: string;
  status: string;
  region: string;
  created_at: string;
  records?: Array<{
    record: string;
    name: string;
    type: string;
    value: string;
    ttl: string;
    status: string;
    priority?: number;
  }>;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-gray-300";

const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const {
    isLoading: gmailLoading,
    isAuthenticated: gmailConnected,
    connect: connectGmail,
    disconnect: disconnectGmail,
  } = useOAuth(APP_ID, OAUTH_PROVIDER);
  const [tab, setTab] = useState<Tab>("send");
  const [mode, setMode] = useState<Mode>("managed");
  const [apiKey, setApiKey] = useState("");

  // Inbox state
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxQuery, setInboxQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // Send email state
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isHtml, setIsHtml] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [sending, setSending] = useState(false);

  // Domain state
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [newDomainName, setNewDomainName] = useState("");
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainStatus, setDomainStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  async function handleGmailConnect() {
    try {
      await connectGmail({
        provider: OAUTH_PROVIDER,
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
        scope: [
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
        additionalParams: { access_type: "offline", prompt: "consent" },
      });
    } catch {
      setStatus({ type: "error", message: "Failed to connect Gmail" });
    }
  }

  async function handleGmailDisconnect() {
    await disconnectGmail();
  }


  async function loadInbox(query?: string, pageToken?: string) {
    setInboxLoading(true);
    setSelectedEmail(null);
    try {
      const res = await fetch("/server-function/gmail-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "list",
          maxResults: 20,
          ...(query ? { query } : {}),
          ...(pageToken ? { pageToken } : {}),
        }),
      });
      const result = await res.json();
      if (res.ok) {
        if (pageToken) {
          setEmails((prev) => [...prev, ...(result.messages || [])]);
        } else {
          setEmails(result.messages || []);
        }
        setNextPageToken(result.nextPageToken || null);
      }
    } finally {
      setInboxLoading(false);
    }
  }

  async function handleOpenEmail(messageId: string) {
    setInboxLoading(true);
    try {
      const res = await fetch("/server-function/gmail-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", messageId }),
      });
      const result = await res.json();
      if (res.ok) {
        setSelectedEmail(result);
      }
    } finally {
      setInboxLoading(false);
    }
  }

  const { runAppAction: runSendEmail } = useActionEffect(
    {
      actionName: "send-email",
      beforeAction: async (args: any) => {
        return {
          ...args,
          ...(mode === "gmail" ? { provider: "gmail" } : {}),
          ...(mode === "byok" && apiKey ? { apiKey } : {}),
        };
      },
      afterAction: async (result: any) => {
        if (!result) return;
        if (result.success) {
          setStatus({
            type: "success",
            message: `Email sent! ID: ${result.id}`,
          });
        } else {
          setStatus({
            type: "error",
            message: result.error || "Failed to send email",
          });
        }
        setSending(false);
        return result;
      },
    },
    [mode, apiKey],
  );


  async function handleSend() {
    if (!runSendEmail) return;
    setSending(true);
    setStatus(null);
    try {
      const result = await runSendEmail({
        to,
        subject,
        ...(mode === "byok" ? { apiKey } : {}),
        ...(mode === "gmail" ? { provider: "gmail" } : {}),
        ...(from ? { from } : {}),
        ...(isHtml ? { html: body } : { text: body }),
      });
      if (result.success) {
        setStatus({ type: "success", message: `Email sent! ID: ${result.id}` });
      } else {
        setStatus({
          type: "error",
          message: result.error || "Failed to send email",
        });
      }
    } finally {
      setSending(false);
    }
  }

  async function domainAction(
    action: string,
    params: Record<string, unknown> = {},
  ) {
    setDomainLoading(true);
    setDomainStatus(null);
    try {
      const res = await fetch("/server-function/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(mode === "byok" ? { apiKey } : {}),
          ...params,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDomainStatus({
          type: "error",
          message: data.error || "Operation failed",
        });
        return { success: false, error: data.error };
      }
      // Normalize list response
      if (action === "list") {
        const items = Array.isArray(data) ? data : data.data || [];
        return { success: true, data: items };
      }
      return { success: true, data };
    } finally {
      setDomainLoading(false);
    }
  }

  async function loadDomains() {
    const result = await domainAction("list");
    if (result?.success) {
      setDomains(result.data || []);
    }
  }

  async function handleCreateDomain() {
    if (!newDomainName) return;
    const result = await domainAction("create", { name: newDomainName });
    if (result?.success) {
      setNewDomainName("");
      setDomainStatus({
        type: "success",
        message: `Domain "${newDomainName}" created`,
      });
      loadDomains();
    }
  }

  async function handleVerifyDomain(domainId: string) {
    const result = await domainAction("verify", { domainId });
    if (result?.success) {
      setDomainStatus({ type: "success", message: "Verification triggered" });
      loadDomains();
    }
  }

  async function handleDeleteDomain(domainId: string, name: string) {
    const result = await domainAction("delete", { domainId });
    if (result?.success) {
      setDomainStatus({
        type: "success",
        message: `Domain "${name}" deleted`,
      });
      if (selectedDomain?.id === domainId) setSelectedDomain(null);
      loadDomains();
    }
  }

  async function handleGetDomain(domainId: string) {
    const result = await domainAction("get", { domainId });
    if (result?.success) {
      setSelectedDomain(result.data);
    }
  }

  function formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  }

  const canSend =
    to && subject && (mode === "managed" || apiKey || (mode === "gmail" && gmailConnected));
  const canUseDomains = mode === "managed" || apiKey;

  return (
    <div className="flex flex-col w-full h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Email Sender
        </h1>
      </div>

      {/* Provider dropdown */}
      <div className="px-5 pb-3">
        <label className={labelClass}>Provider</label>
        <select
          className={`${inputClass} mt-1 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10`}
          value={mode}
          onChange={(e) => {
            const newMode = e.target.value as Mode;
            setMode(newMode);
            if (newMode === "gmail") setTab("send");
          }}
        >
          <option value="managed">Pulse Editor</option>
          <option value="byok">Resend</option>
          <option value="gmail">Gmail</option>
        </select>
      </div>

      {/* API key for BYOK */}
      {mode === "byok" && (
        <div className="px-5 pb-3">
          <label className={labelClass}>API Key</label>
          <input
            className={`${inputClass} mt-1`}
            type="password"
            placeholder="re_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
      )}

      {/* Gmail connection */}
      {mode === "gmail" && (
        <div className="px-5 pb-3">
          {gmailConnected ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-emerald-700">Connected</span>
              </div>
              <button
                className="text-xs text-red-400 hover:text-red-500 font-medium transition-colors"
                onClick={handleGmailDisconnect}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              className="w-full rounded-lg bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] text-gray-700 font-semibold py-2.5 px-4 transition-all shadow-sm flex items-center justify-center gap-x-2"
              disabled={gmailLoading}
              onClick={handleGmailConnect}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {gmailLoading ? "Connecting..." : "Connect Gmail"}
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="px-5 flex gap-x-1 border-b border-gray-200">
        {(["send", ...(mode === "gmail" ? ["inbox"] : ["domains"])] as Tab[]).map((t) => (
          <button
            key={t}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
              tab === t
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 flex flex-col gap-y-3">
        {tab === "send" && (
          <>
            <div>
              <label className={labelClass}>
                From <span className="text-gray-300 normal-case">(optional)</span>
              </label>
              <input
                className={`${inputClass} mt-1`}
                type="email"
                placeholder="you@yourdomain.com"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>To</label>
              <input
                className={`${inputClass} mt-1`}
                type="email"
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Subject</label>
              <input
                className={`${inputClass} mt-1`}
                type="text"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={labelClass}>Body</label>
                <label className="flex items-center gap-x-1.5 cursor-pointer select-none">
                  <div
                    className={`relative w-8 h-[18px] rounded-full transition-colors ${
                      isHtml ? "bg-indigo-500" : "bg-gray-300"
                    }`}
                    onClick={() => setIsHtml(!isHtml)}
                  >
                    <div
                      className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${
                        isHtml ? "translate-x-[16px]" : "translate-x-[2px]"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">HTML</span>
                </label>
              </div>
              <textarea
                className={`${inputClass} mt-1 min-h-[120px] resize-y`}
                placeholder={isHtml ? "<p>Hello!</p>" : "Hello!"}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <button
              className="w-full rounded-lg bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 text-white font-semibold py-2.5 px-4 transition-all shadow-sm"
              disabled={!canSend || sending}
              onClick={handleSend}
            >
              {sending ? "Sending..." : "Send Email"}
            </button>

            {status && (
              <div
                className={`rounded-lg px-3 py-2.5 text-sm ${
                  status.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {status.message}
              </div>
            )}
          </>
        )}

        {tab === "domains" && (
          <>
            <div className="flex gap-x-2">
              <input
                className={`${inputClass} flex-1`}
                type="text"
                placeholder="example.com"
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateDomain()}
              />
              <button
                className="rounded-lg bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 text-white text-sm font-semibold py-2.5 px-4 transition-all shadow-sm whitespace-nowrap"
                disabled={domainLoading || !newDomainName || !canUseDomains}
                onClick={handleCreateDomain}
              >
                Add
              </button>
            </div>

            <button
              className="text-xs text-indigo-500 hover:text-indigo-600 font-medium self-start transition-colors"
              disabled={domainLoading || !canUseDomains}
              onClick={loadDomains}
            >
              {domainLoading ? "Loading..." : "Refresh"}
            </button>

            {domains.length > 0 && (
              <div className="flex flex-col gap-y-2">
                {domains.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm transition-shadow hover:shadow"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-800">
                        {d.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          d.status === "verified"
                            ? "bg-emerald-100 text-emerald-700"
                            : d.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <div className="flex gap-x-3 mt-2">
                      <button
                        className="text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
                        onClick={() => handleGetDomain(d.id)}
                      >
                        Details
                      </button>
                      {d.status !== "verified" && (
                        <button
                          className="text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
                          onClick={() => handleVerifyDomain(d.id)}
                        >
                          Verify
                        </button>
                      )}
                      <button
                        className="text-xs text-red-400 hover:text-red-500 font-medium transition-colors"
                        onClick={() => handleDeleteDomain(d.id, d.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedDomain && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm text-gray-800">
                    {selectedDomain.name}
                  </span>
                  <button
                    className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
                    onClick={() => setSelectedDomain(null)}
                  >
                    Close
                  </button>
                </div>
                <div className="flex gap-x-3 text-xs text-gray-400 mb-3">
                  <span>Region: {selectedDomain.region}</span>
                  <span>Status: {selectedDomain.status}</span>
                </div>
                {selectedDomain.records && selectedDomain.records.length > 0 && (
                  <div className="flex flex-col gap-y-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      DNS Records
                    </span>
                    {selectedDomain.records.map((r, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 rounded-lg p-3 text-xs font-mono break-all border border-gray-100"
                      >
                        <div className="grid grid-cols-[48px_1fr] gap-y-1 gap-x-2">
                          <span className="text-gray-400">Type</span>
                          <span className="text-gray-700">{r.type}</span>
                          <span className="text-gray-400">Name</span>
                          <span className="text-gray-700">{r.name}</span>
                          <span className="text-gray-400">Value</span>
                          <span className="text-gray-700">{r.value}</span>
                          {r.priority !== undefined && (
                            <>
                              <span className="text-gray-400">Priority</span>
                              <span className="text-gray-700">{r.priority}</span>
                            </>
                          )}
                          <span className="text-gray-400">Status</span>
                          <span
                            className={
                              r.status === "verified"
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }
                          >
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {domainStatus && (
              <div
                className={`rounded-lg px-3 py-2.5 text-sm ${
                  domainStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {domainStatus.message}
              </div>
            )}
          </>
        )}

        {tab === "inbox" && (
          <>
            {selectedEmail ? (
              <div className="flex flex-col gap-y-3">
                <button
                  className="text-xs text-indigo-500 hover:text-indigo-600 font-medium self-start transition-colors"
                  onClick={() => setSelectedEmail(null)}
                >
                  &larr; Back to inbox
                </button>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h2 className="font-bold text-sm text-gray-900 mb-2">
                    {selectedEmail.subject || "(no subject)"}
                  </h2>
                  <div className="flex flex-col gap-y-1 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <span className="font-semibold text-gray-400">From:</span>{" "}
                      {selectedEmail.from}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-400">To:</span>{" "}
                      {selectedEmail.to}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-400">Date:</span>{" "}
                      {selectedEmail.date}
                    </div>
                  </div>
                  {selectedEmail.body?.html ? (
                    <iframe
                      srcDoc={selectedEmail.body.html}
                      className="w-full min-h-[300px] border-0 rounded"
                      sandbox="allow-same-origin"
                      title="Email content"
                    />
                  ) : (
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {selectedEmail.body?.text || selectedEmail.snippet}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-x-2">
                  <input
                    className={`${inputClass} flex-1`}
                    type="text"
                    placeholder="Search emails..."
                    value={inboxQuery}
                    onChange={(e) => setInboxQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadInbox(inboxQuery)}
                  />
                  <button
                    className="rounded-lg bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 text-white text-sm font-semibold py-2.5 px-4 transition-all shadow-sm whitespace-nowrap"
                    disabled={inboxLoading || !gmailConnected}
                    onClick={() => loadInbox(inboxQuery)}
                  >
                    {inboxLoading ? "..." : "Search"}
                  </button>
                </div>

                <button
                  className="text-xs text-indigo-500 hover:text-indigo-600 font-medium self-start transition-colors"
                  disabled={inboxLoading || !gmailConnected}
                  onClick={() => loadInbox()}
                >
                  {inboxLoading ? "Loading..." : "Load recent emails"}
                </button>

                {emails.length > 0 && (
                  <div className="flex flex-col gap-y-1">
                    {emails.map((e) => (
                      <button
                        key={e.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm transition-shadow hover:shadow text-left"
                        onClick={() => handleOpenEmail(e.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs truncate max-w-[200px] ${
                              e.isUnread
                                ? "font-bold text-gray-900"
                                : "font-medium text-gray-600"
                            }`}
                          >
                            {e.from?.replace(/<.*>/, "").trim() || e.from}
                          </span>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                            {formatDate(e.date)}
                          </span>
                        </div>
                        <div
                          className={`text-sm truncate ${
                            e.isUnread ? "font-semibold text-gray-800" : "text-gray-700"
                          }`}
                        >
                          {e.subject || "(no subject)"}
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">
                          {e.snippet}
                        </div>
                      </button>
                    ))}

                    {nextPageToken && (
                      <button
                        className="text-xs text-indigo-500 hover:text-indigo-600 font-medium self-center py-2 transition-colors"
                        disabled={inboxLoading}
                        onClick={() => loadInbox(inboxQuery, nextPageToken)}
                      >
                        {inboxLoading ? "Loading..." : "Load more"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
