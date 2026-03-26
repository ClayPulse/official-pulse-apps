---
name: Generate Audio
description: Generate audio, music, and speech using AI models on Replicate. Supports MiniMax Music, Lyria, text-to-speech models, and more.
---

## Overview
Generate music, speech, or sound using AI models on Replicate.

## What this skill does
Takes a text prompt (for music/sound) or text content (for speech), runs an audio generation model, and returns the audio output.

## Usage
- `prompt` (required): Text prompt for music generation, or text content for speech synthesis
- `model` (optional): Replicate model ID (defaults to `minimax/music-2.5`)
- `input` (optional): Additional model-specific parameters (e.g. `voice_id` for TTS)

## Examples
- Music: `{ prompt: "lo-fi ambient chill beats" }`
- Speech: `{ prompt: "Hello, welcome to our app!", model: "minimax/speech-2.8-hd" }`
- With voice: `{ prompt: "Breaking news today", model: "inworld/tts-1.5-max", input: { voice: "narrator" } }`
