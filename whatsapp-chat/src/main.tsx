import React, { useEffect, useState, useCallback, useRef } from "react";
import "./tailwind.css";
import {
  useLoading,
  useActionEffect,
  useAppSettings,
} from "@pulse-editor/react-api";

// ── Types ────────────────────────────────────────────────────────────────────

type View = "setup" | "manual-setup" | "chat";

type Message = {
  id: string;
  from: string;
  to?: string;
  text: string;
  name?: string;
  timestamp: string;
  direction: "incoming" | "outgoing";
  status?: "sending" | "sent" | "failed";
};

type WhatsAppSession = {
  accessToken: string;
  wabaId: string;
  phoneNumberId: string;
  phoneDisplay?: string;
};

// ── Facebook SDK loader ──────────────────────────────────────────────────────

let fbSdkLoaded = false;
let fbSdkPromise: Promise<void> | null = null;

function loadFacebookSdk(appId: string): Promise<void> {
  if (fbSdkLoaded) return Promise.resolve();
  if (fbSdkPromise) return fbSdkPromise;

  fbSdkPromise = new Promise<void>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fbAsyncInit = function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).FB.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v21.0",
      });
      fbSdkLoaded = true;
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
  });

  return fbSdkPromise;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Main() {
  const { isReady: isPulseReady, toggleLoading } = useLoading();
  const {
    isReady: isSettingsReady,
    settings,
    updateSettings,
    deleteSetting,
  } = useAppSettings("whatsapp_chat");

  const [view, setView] = useState<View>("setup");
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metaConfig, setMetaConfig] = useState<{
    metaAppId: string;
    fbConfigId: string;
  } | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [manualPhoneNumberId, setManualPhoneNumberId] = useState("");
  const [manualWabaId, setManualWabaId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Restore session from app settings
  useEffect(() => {
    if (isSettingsReady && settings?.session) {
      setSession(settings.session as WhatsAppSession);
      setView("chat");
    }
  }, [isSettingsReady, settings]);

  useEffect(() => {
    if (isPulseReady) toggleLoading(false);
  }, [isPulseReady, toggleLoading]);

  // Fetch Meta config from backend on mount
  useEffect(() => {
    fetch("/server-function/whatsapp/config")
      .then((res) => res.json())
      .then((data) => setMetaConfig(data))
      .catch(() => setError("Failed to load app configuration."));
  }, []);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Action effects for skill integration ─────────────────────────────────

  const { runAppAction: runSendMessage } = useActionEffect(
    {
      actionName: "send-message",
      beforeAction: async (args: Record<string, unknown>) => args,
      afterAction: async (result: Record<string, unknown>) => {
        if (result?.success) {
          const newMsg: Message = {
            id: (result.messageId as string) || Date.now().toString(),
            from: "me",
            to: result.to as string,
            text:
              ((result as Record<string, unknown>).message as string) ||
              "Message sent",
            timestamp: new Date().toISOString(),
            direction: "outgoing",
            status: "sent",
          };
          setMessages((prev) => [...prev, newMsg]);
        }
        return result;
      },
    },
    [session],
  );

  useActionEffect(
    {
      actionName: "receive-message",
      beforeAction: async (args: Record<string, unknown>) => args,
      afterAction: async (result: Record<string, unknown>) => {
        if (result?.success) {
          const newMsg: Message = {
            id: (result.messageId as string) || Date.now().toString(),
            from: result.from as string,
            text: result.text as string,
            name: result.name as string | undefined,
            timestamp: (result.timestamp as string) || new Date().toISOString(),
            direction: "incoming",
          };
          setMessages((prev) => [...prev, newMsg]);
        }
        return result;
      },
    },
    [],
  );

  // ── Embedded Signup ────────────────────────────────────────────────────────

  const startEmbeddedSignup = useCallback(async () => {
    if (!metaConfig?.metaAppId) {
      setError("META_APP_ID is not configured on the server.");
      return;
    }
    if (!metaConfig?.fbConfigId) {
      setError("FB_CONFIG_ID is not configured on the server.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await loadFacebookSdk(metaConfig.metaAppId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const FB = (window as any).FB;

      FB.login(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (response: any) => {
          if (
            response.status !== "connected" ||
            !response.authResponse?.code
          ) {
            setError("Sign-up was cancelled or not completed.");
            setLoading(false);
            return;
          }

          const code = response.authResponse.code;

          try {
            const res = await fetch(
              "/server-function/whatsapp/exchange-token",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
              },
            );

            const data = await res.json();

            if (!data.success) {
              setError(data.error || "Failed to complete sign-up.");
              setLoading(false);
              return;
            }

            const newSession: WhatsAppSession = {
              accessToken: data.accessToken,
              wabaId: data.wabaId,
              phoneNumberId: data.phoneNumberId,
              phoneDisplay: data.phoneDisplay,
            };

            setSession(newSession);
            updateSettings({ session: newSession });
            setView("chat");
          } catch {
            setError("Failed to exchange token.");
          } finally {
            setLoading(false);
          }
        },
        {
          config_id: metaConfig.fbConfigId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: "",
            sessionInfoVersion: "3",
          },
        },
      );
    } catch {
      setError("Failed to load Facebook SDK.");
      setLoading(false);
    }
  }, [metaConfig, updateSettings]);

  // ── Disconnect ─────────────────────────────────────────────────────────────

  const disconnect = () => {
    setSession(null);
    deleteSetting("session");
    setMessages([]);
    setError("");
    setView("setup");
  };

  // ── Manual connect ─────────────────────────────────────────────────────────

  const handleManualConnect = async () => {
    if (!manualToken.trim() || !manualPhoneNumberId.trim()) {
      setError("Access token and Phone Number ID are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Validate the token by fetching phone number info
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${manualPhoneNumberId.trim()}`,
        { headers: { Authorization: `Bearer ${manualToken.trim()}` } },
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Invalid credentials. Please check your token and Phone Number ID.");
        setLoading(false);
        return;
      }

      const newSession: WhatsAppSession = {
        accessToken: manualToken.trim(),
        wabaId: manualWabaId.trim() || "",
        phoneNumberId: manualPhoneNumberId.trim(),
        phoneDisplay: data.display_phone_number || undefined,
      };

      setSession(newSession);
      updateSettings({ session: newSession });
      setManualToken("");
      setManualPhoneNumberId("");
      setManualWabaId("");
      setView("chat");
    } catch {
      setError("Failed to validate credentials. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!inputText.trim() || !recipientPhone.trim() || !session) return;

    const msgText = inputText.trim();
    const tempId = Date.now().toString();

    const outgoing: Message = {
      id: tempId,
      from: "me",
      to: recipientPhone,
      text: msgText,
      timestamp: new Date().toISOString(),
      direction: "outgoing",
      status: "sending",
    };
    setMessages((prev) => [...prev, outgoing]);
    setInputText("");

    try {
      const res = await fetch("/server-function/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientPhone,
          message: msgText,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setSession(null);
        deleteSetting("session");
        setView("setup");
        setError("Session expired. Please sign in again.");
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...m,
                id: data.data?.messages?.[0]?.id || tempId,
                status: data.success ? "sent" : "failed",
              }
            : m,
        ),
      );

      if (!data.success) {
        setError(data.error || "Failed to send message");
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)),
      );
      setError("Failed to send message");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-full h-full bg-[#f0f2f5] text-gray-900 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#008069] text-white">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <div>
            <h1 className="font-semibold text-[15px] leading-tight">
              WhatsApp Chat
            </h1>
            {session?.phoneDisplay && (
              <span className="text-[11px] text-white/70">
                {session.phoneDisplay}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {view !== "setup" && (
            <button
              onClick={disconnect}
              className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
              aria-label="Disconnect"
              title="Disconnect"
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

      {/* Error toast */}
      {error && (
        <div className="mx-3 mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs flex items-center gap-2">
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600 shrink-0"
          >
            &times;
          </button>
        </div>
      )}

      {/* Setup view — Embedded Signup */}
      {view === "setup" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-lg shadow-green-200">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-semibold">Connect WhatsApp</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Connect your WhatsApp Business account
              <br />
              to send and receive messages.
            </p>
          </div>
          <button
            onClick={startEmbeddedSignup}
            disabled={loading}
            className="w-full max-w-[240px] py-2.5 bg-[#008069] text-white rounded-lg text-sm font-medium hover:bg-[#006e5a] disabled:opacity-50 transition-colors shadow-sm"
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
              "Connect WhatsApp Account"
            )}
          </button>
          <div className="flex items-center gap-3 w-full max-w-[240px]">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-[11px] text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
          <button
            onClick={() => { setError(""); setView("manual-setup"); }}
            className="w-full max-w-[240px] py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Connect Manually
          </button>
          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            Use Embedded Signup or enter your own
            <br />
            access token and Phone Number ID.
          </p>
        </div>
      )}

      {/* Manual setup view */}
      {view === "manual-setup" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-5">
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-semibold">Manual Setup</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Enter your WhatsApp Business API credentials.
            </p>
          </div>
          <div className="w-full max-w-[300px] space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Access Token <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                placeholder="EAAxxxxxxx..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#008069]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Phone Number ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 100234567890"
                value={manualPhoneNumberId}
                onChange={(e) => setManualPhoneNumberId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#008069]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                WABA ID <span className="text-[11px] text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 100234567890"
                value={manualWabaId}
                onChange={(e) => setManualWabaId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#008069]"
              />
            </div>
            <button
              onClick={handleManualConnect}
              disabled={loading || !manualToken.trim() || !manualPhoneNumberId.trim()}
              className="w-full py-2.5 bg-[#008069] text-white rounded-lg text-sm font-medium hover:bg-[#006e5a] disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? "Validating..." : "Connect"}
            </button>
            <button
              onClick={() => { setError(""); setView("setup"); }}
              className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to Embedded Signup
            </button>
          </div>
          <p className="text-[11px] text-gray-400 text-center leading-relaxed max-w-[300px]">
            Get these from the{" "}
            <a
              href="https://developers.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#008069] underline"
            >
              Meta Developer Dashboard
            </a>
            {" "}under WhatsApp &gt; API Setup.
          </p>
        </div>
      )}

      {/* Chat view */}
      {view === "chat" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Recipient bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200">
            <span className="text-xs text-gray-500 shrink-0">To:</span>
            <input
              type="text"
              placeholder="Phone number (e.g. 14155552671)"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-[#008069]"
            />
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-auto px-4 py-3 space-y-2 bg-[#efeae2]">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                No messages yet. Send a message to get started.
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg text-[13px] leading-relaxed shadow-sm ${
                    msg.direction === "outgoing"
                      ? "bg-[#d9fdd3] text-gray-900"
                      : "bg-white text-gray-900"
                  }`}
                >
                  {msg.direction === "incoming" && msg.name && (
                    <div className="text-[11px] font-semibold text-[#008069] mb-0.5">
                      {msg.name}
                    </div>
                  )}
                  <div>{msg.text}</div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.direction === "outgoing" &&
                      msg.status === "sending" && (
                        <span className="text-[10px] text-gray-400">
                          &#9201;
                        </span>
                      )}
                    {msg.direction === "outgoing" && msg.status === "sent" && (
                      <span className="text-[10px] text-[#53bdeb]">
                        &#10003;&#10003;
                      </span>
                    )}
                    {msg.direction === "outgoing" &&
                      msg.status === "failed" && (
                        <span className="text-[10px] text-red-500">
                          &#10007;
                        </span>
                      )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#f0f2f5] border-t border-gray-200">
            <input
              type="text"
              placeholder="Type a message"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-full focus:outline-none focus:border-[#008069]"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || !recipientPhone.trim()}
              className="p-2 bg-[#008069] text-white rounded-full hover:bg-[#006e5a] disabled:opacity-40 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
