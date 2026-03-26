---
name: Generate 3D
description: Generate 3D models from images using AI on Replicate. Supports Rodin and HunYuan 3D.
---

## Overview
Generate 3D models from reference images using AI models on Replicate.

## What this skill does
Takes an image URL, runs a 3D generation model, and returns the 3D model output.

## Usage
- `image` (required): URL of the reference image
- `model` (optional): Replicate model ID (defaults to `hyper3d/rodin`)
- `input` (optional): Additional model-specific parameters

## Examples
- Simple: `{ image: "https://example.com/chair.jpg" }`
- With model: `{ image: "https://example.com/object.jpg", model: "tencent/hunyuan-3d-3.1" }`
