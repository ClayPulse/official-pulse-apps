---
name: Write Notion Content
description: Writes content to a Notion page — either appending to an existing page or creating a new child page.
---

# Write Notion Content

This skill writes text content to Notion. It can either append content to an existing page or create a new child page under a parent.

## Input
- `notionToken` (string, required) — The Notion integration API token.
- `content` (string, required) — The text content to write. Each line becomes a paragraph block.
- `pageId` (string, optional) — Existing page ID to append content to.
- `parentId` (string, optional) — Parent page ID to create a new child page under.
- `title` (string, optional) — Title for the new page (used with parentId).

Either `pageId` or `parentId` must be provided.

## Output
- `success` — Whether the operation succeeded.
- `action` — "appended" or "created".
- `result` — The Notion API response.
