---
name: Generate Image
description: Generate images using AI models on Replicate. Supports FLUX, Imagen, DALL-E, Ideogram, Recraft, Seedream, and many more. Provide a prompt and optionally specify a model.
---

## Overview
Generate images from text prompts using state-of-the-art AI models on Replicate.

## What this skill does
Takes a text prompt and an optional model identifier, then generates an image using the specified model (defaults to FLUX 2 Pro). Returns the prediction output which typically contains image URLs.

## Usage
- `prompt` (required): Text description of the image to generate
- `model` (optional): Replicate model ID (defaults to `black-forest-labs/flux-2-pro`)
- `input` (optional): Additional model-specific parameters to merge with the prompt

## Examples
- Simple: `{ prompt: "a cat astronaut on mars" }`
- With model: `{ prompt: "sunset over mountains", model: "google/imagen-4" }`
- With extras: `{ prompt: "a logo", model: "recraft-ai/recraft-v4", input: { style: "digital_illustration" } }`
