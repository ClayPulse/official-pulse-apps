---
name: Generate Video
description: Generate videos using AI models on Replicate. Supports VEO, Sora, Kling, Seedance, Pixverse, LTX, WAN, and more. Provide a prompt and optionally an image for image-to-video.
---

## Overview
Generate videos from text prompts or images using state-of-the-art AI models on Replicate.

## What this skill does
Takes a text prompt and/or image URL, runs a video generation model, and returns the video output.

## Usage
- `prompt` (required): Text description of the video to generate
- `model` (optional): Replicate model ID (defaults to `google/veo-3`)
- `input` (optional): Additional model-specific parameters (e.g. `image` for image-to-video)

## Examples
- Text-to-video: `{ prompt: "a golden retriever running on a beach" }`
- With model: `{ prompt: "timelapse of a flower blooming", model: "runwayml/gen-4.5" }`
- Image-to-video: `{ prompt: "make this photo come alive", model: "kwaivgi/kling-v3-video", input: { image: "https://..." } }`
