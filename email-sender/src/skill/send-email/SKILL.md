---
name: Send Email
description: Send an email via Gmail (OAuth), Resend API (BYOK), or the Pulse Editor managed email service. Requires recipient, subject, and body.
---

## Overview
This skill sends an email using one of three providers: Gmail (via OAuth), Resend (BYOK with your own API key), or the Pulse Editor managed email service (default, no key required).

## What this skill does
This skill defines an App Action called `send-email` that sends an email. It takes the following inputs:
- `to` (string, required) — Recipient email address.
- `subject` (string, required) — Email subject line.
- `provider` (string, optional) — Set to `"gmail"` to send via a connected Gmail account using OAuth. Omit for Resend or managed mode.
- `apiKey` (string, optional) — Resend API key. If provided, sends via Resend directly. Omit to use the Pulse Editor managed service.
- `from` (string, optional) — Sender email address. Defaults to `onboarding@resend.dev` for Resend/managed mode.
- `html` (string, optional) — HTML body of the email.
- `text` (string, optional) — Plain text body of the email. Used if `html` is not provided.

### Provider selection
- **Gmail**: set `provider: "gmail"` — requires Gmail OAuth to be connected. No `apiKey` needed.
- **Resend (BYOK)**: provide `apiKey` — sends directly via the Resend API.
- **Managed**: omit both `provider` and `apiKey` — uses the Pulse Editor managed email service.

The action returns the email ID on success, or an error message on failure.
