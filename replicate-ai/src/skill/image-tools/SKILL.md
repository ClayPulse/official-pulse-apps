---
name: Image Tools
description: Process images using AI tools on Replicate — upscale, remove backgrounds, erase objects, colorize, vectorize, expand, and more.
---

## Overview
Apply AI-powered image processing tools via Replicate. Includes upscaling, background removal, object erasure, colorization, vectorization, and more.

## What this skill does
Takes an image URL and a tool model identifier, runs the specified image processing model, and returns the result.

## Usage
- `image` (required): URL of the image to process
- `model` (required): Replicate model ID for the tool (e.g. `google/upscaler`, `bria/eraser`)
- `input` (optional): Additional model-specific parameters

## Examples
- Upscale: `{ image: "https://...", model: "google/upscaler" }`
- Remove BG: `{ image: "https://...", model: "bria/remove-background" }`
- Erase object: `{ image: "https://...", model: "bria/eraser", input: { mask: "https://..." } }`
