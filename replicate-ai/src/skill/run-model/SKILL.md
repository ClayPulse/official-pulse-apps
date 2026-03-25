---
name: Run Replicate Model
description: Run any AI model on Replicate by specifying the model identifier and input parameters. Supports image generation, text generation, audio, video, and any other model available on Replicate.
---

## Overview
This skill runs an AI model on Replicate's platform. It accepts a model identifier (e.g. `black-forest-labs/flux-schnell` or `meta/meta-llama-3-70b-instruct`) and an input object whose shape depends on the model.

## What this skill does
Given a Replicate model identifier and its required inputs, this skill creates a prediction via the Replicate API, waits for it to complete, and returns the full output. The output format varies by model -- it could be URLs to generated images, generated text, audio files, etc.

## Usage
- `model`: The model identifier in `owner/name` format (e.g. `black-forest-labs/flux-schnell`)
- `input`: An object containing the model's input parameters (varies per model -- check the model's API page on replicate.com for details)

## Examples
- Image generation: `{ model: "black-forest-labs/flux-schnell", input: { prompt: "a cat astronaut" } }`
- Text generation: `{ model: "meta/meta-llama-3-70b-instruct", input: { prompt: "Explain quantum computing" } }`
