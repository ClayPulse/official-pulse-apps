/**
 * @typedef {Object} NoteItem
 * @property {string} title - The meeting note title.
 * @property {string} content - The meeting note content.
 */
type NoteItem = {
  title: string;
  content: string;
};

/**
 * @typedef {Object} Output - The output of the export-notes action.
 * @property {NoteItem[]} notes - A list of meeting notes with title and content.
 */
type Output = {
  notes: NoteItem[];
};

/**
 * Export all meeting notes from Granola, each with title and content.
 *
 * @returns {Promise<Output>} The list of meeting notes.
 */
export default async function exportNotes(): Promise<Output> {
  try {
    // 1. Fetch the list of meetings
    const listRes = await fetch("/server-function/granola/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const listData = await listRes.json();

    const content = listData.result?.content;
    if (!content?.length) {
      return { notes: [] };
    }

    const text = content
      .filter((c: { type: string; text?: string }) => c.type === "text" && c.text)
      .map((c: { text?: string }) => c.text!)
      .join("\n");

    // Extract meeting IDs and titles
    const meetings: { id: string; title: string }[] = [];

    // Try XML meeting elements: <meeting id="..." title="...">
    const meetingTagPattern = /<meeting\s[^>]*?id="([^"]+)"[^>]*?title="([^"]+)"[^>]*>/g;
    let match: RegExpExecArray | null;
    while ((match = meetingTagPattern.exec(text)) !== null) {
      meetings.push({ id: match[1], title: match[2] });
    }

    // Also try title before id
    if (meetings.length === 0) {
      const altPattern = /<meeting\s[^>]*?title="([^"]+)"[^>]*?id="([^"]+)"[^>]*>/g;
      while ((match = altPattern.exec(text)) !== null) {
        meetings.push({ id: match[2], title: match[1] });
      }
    }

    // Try JSON array fallback
    if (meetings.length === 0) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          for (const m of parsed) {
            meetings.push({
              id: m.id || m.meeting_id || "",
              title: m.title || m.name || "Untitled",
            });
          }
        }
      } catch {
        // Not JSON
      }
    }

    if (meetings.length === 0) {
      return { notes: [] };
    }

    // 2. Fetch content for each meeting
    const notes: NoteItem[] = await Promise.all(
      meetings.map(async (meeting) => {
        try {
          const noteRes = await fetch("/server-function/granola/note", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meetingId: meeting.id }),
          });
          const noteData = await noteRes.json();

          // Extract text content from the MCP response
          const noteContent = noteData.note?.result?.content;
          let noteText = "";
          if (noteContent?.length) {
            noteText = noteContent
              .filter((c: { type: string; text?: string }) => c.type === "text" && c.text)
              .map((c: { text?: string }) => c.text!)
              .join("\n");
          }

          return { title: meeting.title, content: noteText };
        } catch {
          return { title: meeting.title, content: "" };
        }
      }),
    );

    return { notes };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { notes: [{ title: "Error", content: message }] };
  }
}
