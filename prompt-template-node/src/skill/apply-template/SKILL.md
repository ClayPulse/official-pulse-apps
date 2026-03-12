---
name: Apply Prompt Template
description: Takes a prompt template string with {varName} placeholders and an object of variable values, and returns the template with all placeholders replaced.
---

## Overview
This skill replaces `{varName}` placeholders in a prompt template with values from a provided variables object.

## What this skill does
Given a `template` string like `"Hello {name}, welcome to {place}"` and a `variables` object like `{ name: "Alice", place: "Wonderland" }`, it returns `"Hello Alice, welcome to Wonderland"`.
