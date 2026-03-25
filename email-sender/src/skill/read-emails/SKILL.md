---
name: Read Emails
description: Read emails from a connected Gmail account. Can list recent emails or read the full content of a specific email by ID.
---

## Overview
This skill reads emails from a user's Gmail account via OAuth. It requires the user to have connected their Gmail account first.

## What this skill does
This skill defines an App Action called `read-emails` that can:
- **List** recent emails with sender, subject, date, and snippet preview
- **Get** the full content of a specific email by message ID

### List emails
- `action` (string, required) — Must be `"list"`
- `query` (string, optional) — Gmail search query (e.g. `"is:unread"`, `"from:someone@example.com"`)
- `maxResults` (number, optional) — Max messages to return (default 20)

### Get email content
- `action` (string, required) — Must be `"get"`
- `messageId` (string, required) — The Gmail message ID to retrieve

The action returns the email data on success, or an error message on failure.
