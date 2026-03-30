---
name: Generate PDF Document
description: Generates a PDF document from HTML content. Takes an HTML string as input and returns the PDF as a base64-encoded string. Supports headings, paragraphs, bold/italic text, images, lists, tables, links, and blockquotes.
---

## Overview
This skill generates a PDF document from HTML content. It parses the HTML and renders it into a properly formatted A4 PDF with support for common HTML elements.

## What this skill does
Takes a `content` string containing HTML as input, generates a formatted A4 PDF document, and returns the PDF as a base64-encoded string.

## Supported HTML elements
- **Headings**: `<h1>` through `<h6>`
- **Text formatting**: `<strong>`, `<b>`, `<em>`, `<i>`, `<u>`
- **Paragraphs**: `<p>`, `<div>`, `<br>`
- **Lists**: `<ul>`, `<ol>`, `<li>` (nested supported)
- **Tables**: `<table>`, `<tr>`, `<td>`, `<th>`
- **Images**: `<img>` (remote URLs and data URIs, PNG/JPG)
- **Links**: `<a>` (rendered as underlined blue text)
- **Other**: `<blockquote>`, `<hr>`, `<pre>`, `<code>`

## When to use
- When a user needs to convert content into a downloadable PDF
- When generating reports, summaries, or documents from AI-generated content
- When creating PDF output that includes formatted text, images, and tables
