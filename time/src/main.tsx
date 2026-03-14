import React, { useEffect, useState, useMemo } from "react";
import "./tailwind.css";
import { useLoading, useActionEffect } from "@pulse-editor/react-api";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function formatTZLabel(tz: string) {
  return tz.replace(/_/g, " ").replace(/\//g, " / ");
}

export default function Main() {
  const { isReady, toggleLoading } = useLoading();
  const [timezone, setTimezone] = useState("UTC");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (isReady) toggleLoading(false);
  }, [isReady, toggleLoading]);

  useActionEffect(
    {
      actionName: "get-time",
      beforeAction: async (args: any) => {
        // If no timezone specified by the agent, use the currently selected one
        if (!args.timezone) {
          return { ...args, timezone };
        }
        return args;
      },
      afterAction: async (result: any) => {
        return result;
      },
    },
    [timezone],
  );

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const parts = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const p = formatter.formatToParts(now);
    const get = (type: string) =>
      p.find((x) => x.type === type)?.value ?? "00";
    const h = parseInt(get("hour"), 10);
    const m = parseInt(get("minute"), 10);
    const s = parseInt(get("second"), 10);
    return { h, m, s };
  }, [now, timezone]);

  const dateStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(now);
  }, [now, timezone]);

  const digitalTime = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(now);
  }, [now, timezone]);

  // Clock hand angles
  const secondAngle = parts.s * 6;
  const minuteAngle = parts.m * 6 + parts.s * 0.1;
  const hourAngle = (parts.h % 12) * 30 + parts.m * 0.5;

  const hourMarkers = Array.from({ length: 12 }, (_, i) => {
    const angle = i * 30;
    const rad = ((angle - 90) * Math.PI) / 180;
    const r = 44;
    const x = 50 + r * Math.cos(rad);
    const y = 50 + r * Math.sin(rad);
    return { x, y, label: i === 0 ? "12" : String(i) };
  });

  const minuteMarkers = Array.from({ length: 60 }, (_, i) => {
    const angle = i * 6;
    const rad = ((angle - 90) * Math.PI) / 180;
    const isHour = i % 5 === 0;
    const r1 = isHour ? 38 : 40;
    const r2 = 42;
    return {
      x1: 50 + r1 * Math.cos(rad),
      y1: 50 + r1 * Math.sin(rad),
      x2: 50 + r2 * Math.cos(rad),
      y2: 50 + r2 * Math.sin(rad),
      isHour,
    };
  });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 gap-4 select-none"
      style={{ background: "var(--background)", color: "var(--background) === '#0a0a0a' ? '#fff' : '#111'" }}
    >
      {/* Timezone selector */}
      <select
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm
          bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {formatTZLabel(tz)}
          </option>
        ))}
      </select>

      {/* Analog clock */}
      <svg viewBox="0 0 100 100" className="w-56 h-56 drop-shadow-lg">
        {/* Face */}
        <circle cx="50" cy="50" r="48" fill="white" stroke="#334155" strokeWidth="2" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />

        {/* Minute tick marks */}
        {minuteMarkers.map((m, i) => (
          <line
            key={i}
            x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
            stroke={m.isHour ? "#334155" : "#cbd5e1"}
            strokeWidth={m.isHour ? 1 : 0.4}
          />
        ))}

        {/* Hour numbers */}
        {hourMarkers.map((m) => (
          <text
            key={m.label}
            x={m.x}
            y={m.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="5"
            fontWeight="600"
            fill="#334155"
          >
            {m.label}
          </text>
        ))}

        {/* Hour hand */}
        <line
          x1="50" y1="50"
          x2="50" y2="24"
          stroke="#1e293b"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 50 50)`}
        />

        {/* Minute hand */}
        <line
          x1="50" y1="50"
          x2="50" y2="16"
          stroke="#475569"
          strokeWidth="1.8"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 50 50)`}
        />

        {/* Second hand */}
        <line
          x1="50" y1="54"
          x2="50" y2="14"
          stroke="#ef4444"
          strokeWidth="0.6"
          strokeLinecap="round"
          transform={`rotate(${secondAngle} 50 50)`}
        />

        {/* Center dot */}
        <circle cx="50" cy="50" r="2" fill="#1e293b" />
        <circle cx="50" cy="50" r="1" fill="#ef4444" />
      </svg>

      {/* Digital time */}
      <div className="text-center">
        <div className="text-3xl font-mono font-bold tracking-wider text-gray-800 dark:text-gray-100">
          {digitalTime}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {dateStr}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {formatTZLabel(timezone)}
        </div>
      </div>
    </div>
  );
}
