---
name: Kontext Apps
description: Edit and transform images using FLUX Kontext apps on Replicate — cartoonify, change hairstyle, create headshots, restore photos, remove text, and more.
---

## Overview
Use FLUX Kontext-powered apps to edit and transform images with text instructions.

## What this skill does
Takes an image URL and a text prompt describing the desired edit, runs a Kontext app model, and returns the transformed image.

## Usage
- `prompt` (required): Text instruction for the image edit
- `image_url` (required): URL of the image to transform
- `model` (optional): Kontext app model ID (defaults to `flux-kontext-apps/cartoonify`)
- `input` (optional): Additional model-specific parameters

## Examples
- Cartoonify: `{ prompt: "turn into a cartoon", image_url: "https://..." }`
- Headshot: `{ prompt: "professional headshot", image_url: "https://...", model: "flux-kontext-apps/professional-headshot" }`
