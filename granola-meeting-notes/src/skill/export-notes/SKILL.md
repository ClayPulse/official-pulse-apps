---
name: export-notes
description: Export meeting notes from Granola.ai as markdown
arguments:
  - name: noteId
    description: The Granola note ID to export (e.g. not_xxxxxxxxxxxxx). If omitted, exports the most recent note.
    required: false
  - name: includeTranscript
    description: Whether to include the full transcript in the export
    required: false
---

# Export Granola Meeting Notes

This skill fetches meeting notes from Granola.ai and returns them as formatted markdown, including the summary, attendees, calendar event details, and optionally the full transcript.

## Usage

- To export a specific note, provide its `noteId`.
- To export the most recent note, omit `noteId`.
- Set `includeTranscript` to true to include the full meeting transcript.
