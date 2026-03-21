import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

type Mode = "managed" | "byok";
type Tab = "send" | "domains";
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
  const [tab, setTab] = useState<Tab>("send");
  const [mode, setMode] = useState<Mode>("managed");
  const [apiKey, setApiKey] = useState("");

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

  const { runAppAction: runSendEmail } = useActionEffect(
    {
      actionName: "send-email",
      beforeAction: async (args: any) => {
        return args;
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
    [],
  );

  const { runAppAction: runManageDomains } = useActionEffect(
    {
      actionName: "manage-domains",
      beforeAction: async (args: any) => {
        return args;
      },
      afterAction: async (result: any) => {
        if (!result) return;
        if (!result.success) {
          setDomainStatus({
            type: "error",
            message: result.error || "Operation failed",
          });
        }
        setDomainLoading(false);
        return result;
      },
    },
    [],
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
    if (!runManageDomains) return null;
    setDomainLoading(true);
    setDomainStatus(null);
    try {
      const result = await runManageDomains({
        action,
        ...(mode === "byok" ? { apiKey } : {}),
        ...params,
      });
      if (!result.success) {
        setDomainStatus({
          type: "error",
          message: result.error || "Operation failed",
        });
      }
      return result;
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

  const canSend = to && subject && (mode === "managed" || apiKey);
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
          onChange={(e) => setMode(e.target.value as Mode)}
        >
          <option value="managed">Pulse Editor</option>
          <option value="byok">Resend</option>
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

      {/* Tabs */}
      <div className="px-5 flex gap-x-1 border-b border-gray-200">
        {(["send", "domains"] as Tab[]).map((t) => (
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
      </div>
    </div>
  );
}
