---
name: List Notion Pages
description: Lists all pages accessible to the integration, or child pages under a specific page.
---

# List Notion Pages

This skill lists Notion pages. If a page ID is provided, it returns child pages under that page. Otherwise, it returns all pages the integration has access to.

## Input
- `notionToken` (string, required) — The Notion integration API token.
- `pageId` (string, optional) — Parent page ID to list children of. If omitted, lists all accessible pages.

## Output
- `pages` — Array of page objects from Notion.
