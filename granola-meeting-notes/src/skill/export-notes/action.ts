/**
 * @typedef {Object} Input - The input parameters for the export-notes action.
 * @property {string} [meetingId] - The Granola meeting ID to export. If omitted, exports the most recent meeting.
 * @property {boolean} [includeTranscript] - Whether to include the full transcript.
 */
type Input = {
  meetingId?: string;
  includeTranscript?: boolean;
};

/**
 * @typedef {Object} Output - The output of the export-notes action.
 * @property {string} markdown - The exported meeting note as formatted markdown.
 * @property {string} title - The title of the meeting note.
 * @property {string} meetingId - The ID of the exported meeting.
 * @property {boolean} success - Whether the export was successful.
 * @property {string} [error] - Error message if the export failed.
 */
type Output = {
  markdown: string;
  title: string;
  meetingId: string;
  success: boolean;
  error?: string;
};

/**
 * Export meeting notes from Granola.ai as formatted markdown via MCP.
 * Requires the user to be authenticated via OAuth in the Pulse App UI.
 *
 * @param {Input} input - The input parameters for the export action.
 * @returns {Promise<Output>} The exported meeting note.
 */
export default async function exportNotes({
  meetingId,
  includeTranscript = false,
}: Input): Promise<Output> {
  try {
    const accessToken = typeof localStorage !== "undefined"
      ? localStorage.getItem("granola_access_token")
      : null;

    if (!accessToken) {
      return { markdown: "", title: "", meetingId: "", success: false, error: "Not authenticated. Please sign in via the Granola Notes app first." };
    }

    // If no meetingId, list meetings and pick the first
    if (!meetingId) {
      const listRes = await fetch("/server-function/granola/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const listData = await listRes.json();
      const content = listData.result?.content;
      if (!content?.length) {
        return { markdown: "", title: "", meetingId: "", success: false, error: "No meetings found" };
      }
      // Try to extract the first meeting ID from the response
      const text = content.map((c: { text?: string }) => c.text || "").join("\n");
      const idMatch = text.match(/\b(not_[a-zA-Z0-9]{14}|[a-f0-9-]{36})\b/);
      if (!idMatch) {
        return { markdown: text, title: "Recent Meetings", meetingId: "", success: true };
      }
      meetingId = idMatch[1];
    }

    const noteRes = await fetch("/server-function/granola/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, meetingId, includeTranscript }),
    });
    const data = await noteRes.json();

    if (data.error) {
      return { markdown: "", title: "", meetingId: meetingId!, success: false, error: typeof data.error === "string" ? data.error : data.error.message };
    }

    const noteText = extractText(data.note);
    const transcriptText = data.transcript ? extractText(data.transcript) : "";

    let markdown = noteText;
    if (transcriptText) {
      markdown += `\n\n## Transcript\n\n${transcriptText}`;
    }

    // Extract title from first line
    const titleMatch = noteText.match(/^#?\s*(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : "Meeting Notes";

    return { markdown, title, meetingId: meetingId!, success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { markdown: "", title: "", meetingId: meetingId || "", success: false, error: message };
  }
}

function extractText(mcpResponse: { result?: { content?: Array<{ type: string; text?: string }> } }): string {
  const content = mcpResponse.result?.content;
  if (!content?.length) return "";
  return content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text!)
    .join("\n\n");
}
