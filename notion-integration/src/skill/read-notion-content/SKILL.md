---
name: Read Notion Content
description: Reads the content and metadata of a Notion page by its page ID.
---

# Read Notion Content

This skill reads a Notion page's content (blocks) and metadata given a page ID and Notion API token.

## Input
- `pageId` (string, required) — The Notion page ID to read.
- `notionToken` (string, required) — The Notion integration API token.

## Output
- `page` — The page metadata object from Notion.
- `blocks` — Array of block objects representing the page content.
