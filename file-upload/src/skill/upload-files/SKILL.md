---
name: Upload and Parse Files
description: Upload files and extract their content. Supports .txt, .md, .csv, .json, .xml, .html, .css, .js, .ts, .tsx, .jsx (plain text), .docx (Word documents), and .xlsx/.xls (Excel spreadsheets). Returns the file name, extension, and parsed text content for each file.
---

## Overview
This skill allows AI agents and users to upload files and get their parsed text content. It handles multiple file formats by routing each file to the appropriate parser.

## Supported formats
- **Plain text**: .txt, .md, .csv, .json, .xml, .html, .css, .js, .ts, .tsx, .jsx
- **Word documents**: .docx (parsed via mammoth)
- **Spreadsheets**: .xlsx, .xls (parsed via xlsx, outputs CSV per sheet)

## What this skill does
Takes an array of files (as base64-encoded strings with filenames) and returns parsed content for each file including the file name, extension, and extracted text content.
