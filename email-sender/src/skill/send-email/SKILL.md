---
name: Send Email
description: Send an email to a recipient using the Resend API. Requires a Resend API key, recipient email address, subject, and email body (HTML or plain text).
---

## Overview
This skill sends an email via the Resend API. It accepts a Resend API key, sender address, recipient email, subject line, and body content (HTML or plain text).

## What this skill does
This skill defines an App Action called `send-email` that sends an email using the Resend API. It takes the following inputs:
- `apiKey` (string, required) — Resend API key for authentication.
- `to` (string, required) — Recipient email address.
- `subject` (string, required) — Email subject line.
- `html` (string, optional) — HTML body of the email.
- `text` (string, optional) — Plain text body of the email. Used if `html` is not provided.
- `from` (string, optional) — Sender email address. Defaults to `onboarding@resend.dev`.

The action returns the Resend API response containing the email ID on success, or an error message on failure.
