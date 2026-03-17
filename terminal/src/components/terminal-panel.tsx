import React, { useState } from "react";
import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import "../lib/styles/xterm-style-override.css";
import { FitAddon } from "@xterm/addon-fit";
import {
  useActionEffect,
  useLoading,
  useTerminal,
} from "@pulse-editor/react-api";

export default function TerminalPanel() {
  const { websocketUrl, projectHomePath } = useTerminal();
  const [ws, setWs] = useState<string | undefined>(undefined);

  const { toggleLoading } = useLoading();

  const [isWebsocketAvailable, setIsWebsocketAvailable] = useState(false);

  const terminalDivRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal>(null);
  const fitAddonRef = useRef<FitAddon>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttemptsRef = useRef(0);
  const isReconnectionRef = useRef(false);

  useActionEffect(
    {
      actionName: "terminal-agent",
      beforeAction: async (input) => {
        return input;
      },
      afterAction: async (output) => {
        if (websocketRef.current) {
          const { script } = output as { script: string };
          const socket = websocketRef.current;
          script.split("\n").forEach((line: string) => {
            socket.send(line + "\r");
          });
        }
        return output;
      },
    },
    [projectHomePath, ws],
  );

  useActionEffect(
    {
      actionName: "execute-command",
      beforeAction: async (input) => {
        return input;
      },
      afterAction: async (output) => {
        const { command } = output as { response: string; command?: string };
        if (websocketRef.current && command) {
          const socket = websocketRef.current;
          socket.send(
            JSON.stringify({
              type: "input",
              payload: command + "\r",
            }),
          );
        }
        return output;
      },
    },
    [projectHomePath, ws],
  );

  useActionEffect(
    {
      actionName: "remote-terminal",
      beforeAction: async (input) => {
        const { websocketUrl } = input as { websocketUrl: string };
        setWs(() => websocketUrl);
        return input;
      },
      afterAction: async (output) => {
        return output;
      },
    },
    [],
  );

  useEffect(() => {
    if (websocketUrl) {
      setWs(websocketUrl);
    }
  }, [websocketUrl]);

  // Handle WebSocket connection
  useEffect(() => {
    if (ws) {
      try {
        const terminal = new Terminal({
          fontFamily: "monospace",
          scrollOnEraseInDisplay: true,
        });
        terminalRef.current = terminal;

        // Attach WS addon
        attachWS(terminal, ws);

        // Fit addon
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        fitAddonRef.current = fitAddon;

        // Open terminal
        terminal.open(terminalDivRef.current as HTMLDivElement);
        fitAddon.fit();

        // Create a ResizeObserver instance
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.target === terminalDivRef.current) {
              fitAddon.fit();
            }
          }
        });
        observerRef.current = observer;

        if (terminalDivRef.current) {
          observer.observe(terminalDivRef.current);
        }

        setIsWebsocketAvailable(true);
      } catch (error) {
        console.error("Failed to attach WebSocket to terminal:", error);
      }

      return () => {
        terminalRef.current?.dispose();
        observerRef.current?.disconnect();
        if (reconnectTimeoutRef.current)
          clearTimeout(reconnectTimeoutRef.current);
        websocketRef.current?.close();
      };
    }
  }, [ws, projectHomePath]);

  function scheduleReconnect(terminal: Terminal, wsUrl: string) {
    const delay = Math.min(5000, 1000 * 2 ** reconnectAttemptsRef.current);
    console.log(`Attempting to reconnect in ${delay / 1000}s...`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      attachWS(terminal, wsUrl);
    }, delay);
  }

  function attachWS(terminal: Terminal, ws: string) {
    if (!ws) {
      throw new Error("No WebSocket URL provided.");
    }

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    const webSocket = new WebSocket(ws);
    websocketRef.current = webSocket;
    webSocket.onopen = () => {
      if (!isReconnectionRef.current) {
        console.log("WebSocket connection established.");
        toggleLoading(false);
        webSocket.send(
          JSON.stringify({
            type: "input",
            payload: `cd ${projectHomePath} && clear\r`,
          }),
        );
      } else {
        console.log("WebSocket reconnected.");
        reconnectAttemptsRef.current = 0;
      }

      const { cols, rows } = terminal;
      webSocket.send(
        JSON.stringify({
          type: "resize",
          payload: { cols, rows },
        }),
      );
    };
    webSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "output") {
        terminal.write(message.payload);
      }
    };
    webSocket.onerror = (error) => {
      console.error("WebSocket error: ", error);
    };
    webSocket.onclose = (event) => {
      console.warn("WebSocket closed:", event.reason || event.code);
      if (!event.wasClean) {
        isReconnectionRef.current = true;
        scheduleReconnect(terminal, ws);
      } else {
        console.log("WebSocket connection closed cleanly.");
        isReconnectionRef.current = false;
      }
    };

    terminal.onData((data) => {
      if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(
          JSON.stringify({
            type: "input",
            payload: data,
          }),
        );
      }
    });

    terminal.onResize(({ cols, rows }) => {
      if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(
          JSON.stringify({
            type: "resize",
            payload: { cols, rows },
          }),
        );
      }
    });
  }

  return (
    <>
      <div
        className="h-full py-0.5 px-1 bg-black overflow-hidden hidden data-[is-loaded=true]:block"
        id="terminal"
        ref={terminalDivRef}
        onClick={() => {
          terminalRef.current?.focus();
        }}
        data-is-loaded={isWebsocketAvailable}
      />

      {!isWebsocketAvailable &&
        (ws ? (
          <div className="bg-black h-full">
            <p className="text-white p-4">Loading terminal </p>
          </div>
        ) : (
          <div className="bg-black h-full">
            <p className="text-white p-4">No terminal is connected.</p>
          </div>
        ))}
    </>
  );
}
