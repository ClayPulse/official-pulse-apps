---
name: Manage Domains
description: Manage email sending domains via the Resend API — create, verify, list, get details, and delete domains.
---

## Overview
This skill manages email sending domains through the Resend API. It supports creating new domains, verifying them, listing all domains, retrieving domain details (including DNS records), and deleting domains.

## What this skill does
This skill defines an App Action called `manage-domains` that performs domain management operations:

- **list** — List all domains on the account.
- **get** — Get details of a specific domain, including DNS records needed for verification.
- **create** — Add a new domain with optional region, tracking, and TLS settings.
- **verify** — Trigger verification for a domain.
- **delete** — Remove a domain.

All operations require a Resend API key (provided directly or via Pulse Editor managed service).
