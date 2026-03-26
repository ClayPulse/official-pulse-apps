---
name: Video Tools
description: Process videos using AI tools on Replicate — lip sync, motion control, translate, upscale, remove backgrounds, erase objects, add sound effects, and more.
---

## Overview
Apply AI-powered video processing tools via Replicate.

## What this skill does
Takes a video URL (or image + audio), runs the specified video tool model, and returns the processed result.

## Usage
- `model` (required): Replicate model ID for the video tool
- `input` (required): Model-specific parameters (typically includes `video_url`, `audio`, `text`, etc.)

## Examples
- Lip sync: `{ model: "sync/lipsync-2", input: { video_url: "https://...", audio_url: "https://..." } }`
- Translate: `{ model: "heygen/video-translate", input: { video_url: "https://...", target_language: "es" } }`
- Upscale: `{ model: "bria/video-increase-resolution", input: { video_url: "https://..." } }`
