/**
 * @typedef {Object} Input - The input parameters for the get-time action.
 * @property {string} [timezone] - The IANA timezone identifier (e.g. "America/New_York"). Defaults to "UTC".
 * @property {string} [format] - The time format string. Supported values: "12h" (e.g. "3:45:10 PM"), "24h" (e.g. "15:45:10"), "iso" (ISO 8601), "date-only" (e.g. "March 15, 2026"), "time-only" (e.g. "15:45:10"). Defaults to "24h".
 */
type Input = {
  timezone?: string;
  format?: "12h" | "24h" | "iso" | "date-only" | "time-only";
};

/**
 * @typedef {Object} Output - The output of the get-time action.
 * @property {string} time - The formatted time string.
 * @property {string} timezone - The timezone used.
 * @property {string} format - The format used.
 */
type Output = {
  time: string;
  timezone: string;
  format: string;
};

/**
 * Returns the current time as a formatted string for the given timezone and format.
 *
 * @param {Input} input - The input parameters for the get-time action.
 *
 * @returns {Output} The formatted time output.
 */
export default function getTime({
  timezone = "UTC",
  format = "24h",
}: Input = {}): Output {
  const now = new Date();

  let time: string;

  switch (format) {
    case "12h":
      time = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now);
      break;
    case "iso":
      time = now.toLocaleString("sv-SE", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).replace(" ", "T");
      break;
    case "date-only":
      time = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(now);
      break;
    case "time-only":
      time = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);
      break;
    case "24h":
    default:
      time = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);
      break;
  }

  return { time, timezone, format };
}
