---
name: Review Tasks
description: Displays a list of task items (documents, to-dos, images, email drafts, etc.) for human review and approval. Accepts any list of objects and passes them through after the user reviews them.
---

## Overview
This skill presents a list of task items to the user for review and approval. It acts as a human-in-the-loop checkpoint — items are displayed in the Task List View UI so the user can inspect them before they proceed through an automated workflow.

## What this skill does
The `review-tasks` action accepts a list of task items (each an object with optional fields like `type`, `name`, `description`, `status`, `url`, and any additional metadata). It displays these items in a user-friendly list view and returns them as-is once reviewed.

### Supported item types
- **document** — PDFs, text files, spreadsheets, etc.
- **todo** — To-do items or action items
- **image** — Images or visual assets
- **email-draft** — Email drafts pending review
- Any other object type — displayed generically

### Input
- `items` (array of objects, required) — The list of task items to review. Each item can have any shape but common fields include `type`, `name`, `description`, `status`, and `url`.

### Output
- `items` (array of objects) — The same list of items, passed through unchanged.
