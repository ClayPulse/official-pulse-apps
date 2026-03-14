---
name: Get Current Time
description: Returns the current date and time as a formatted string for a given timezone. Supports multiple formats including 12-hour, 24-hour, ISO 8601, date-only, and time-only.
---

## Overview
This skill returns the current time formatted as a string. It accepts an optional timezone (IANA identifier, defaults to UTC) and an optional format specifier.

## What this skill does
Returns the current time in the requested format and timezone. Useful for agents that need to know the current time or display it to users.

## Supported formats
- `24h` (default) — full date and time in 24-hour format
- `12h` — time only in 12-hour format with AM/PM
- `iso` — ISO 8601 format (e.g. 2026-03-15T14:30:00)
- `date-only` — human-readable date (e.g. March 15, 2026)
- `time-only` — time only in 24-hour format (e.g. 14:30:00)
