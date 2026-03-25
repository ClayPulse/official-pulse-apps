/**
 * @typedef {Object} Input - The input parameters for reading emails.
 * @property {string} action - The action to perform: "list" or "get".
 * @property {string} [query] - Gmail search query for filtering (list only).
 * @property {number} [maxResults] - Maximum number of messages to return (list only, default 20).
 * @property {string} [messageId] - The message ID to retrieve (get only).
 * @property {string} [pageToken] - Pagination token for next page (list only).
 */
type Input = {
  action: "list" | "get";
  query?: string;
  maxResults?: number;
  messageId?: string;
  pageToken?: string;
};

/**
 * @typedef {Object} MessageSummary - A summary of an email message.
 * @property {string} id - The Gmail message ID.
 * @property {string} threadId - The thread ID.
 * @property {string} snippet - A short preview of the message.
 * @property {string} from - The sender.
 * @property {string} to - The recipient.
 * @property {string} subject - The subject line.
 * @property {string} date - The date string.
 * @property {boolean} isUnread - Whether the message is unread.
 */

/**
 * @typedef {Object} Output - The output of the read emails action.
 * @property {boolean} success - Whether the operation succeeded.
 * @property {MessageSummary[]} [messages] - List of messages (for list action).
 * @property {Object} [message] - Full message content (for get action).
 * @property {string} [nextPageToken] - Token for the next page (for list action).
 * @property {string} [error] - Error message if the operation failed.
 */
type Output = {
  success: boolean;
  messages?: any[];
  message?: any;
  nextPageToken?: string;
  error?: string;
};

/**
 * Read emails from a connected Gmail account. Supports listing recent emails
 * and reading the full content of a specific email.
 *
 * @param {Input} input - The input parameters for reading emails.
 *
 * @returns {Output} The result of the read operation.
 */
export default async function readEmails({
  action,
  query,
  maxResults,
  messageId,
  pageToken,
}: Input): Promise<Output> {
  const response = await fetch("/server-function/gmail-messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      ...(query ? { query } : {}),
      ...(maxResults ? { maxResults } : {}),
      ...(messageId ? { messageId } : {}),
      ...(pageToken ? { pageToken } : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error || "Failed to read emails" };
  }

  if (action === "list") {
    return {
      success: true,
      messages: data.messages,
      nextPageToken: data.nextPageToken,
    };
  }

  return { success: true, message: data };
}
