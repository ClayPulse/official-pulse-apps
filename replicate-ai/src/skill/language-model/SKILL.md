---
name: Language Model
description: Run language models on Replicate — GPT, DeepSeek, Gemini, Llama, Claude, Grok, and more. Send a prompt and get a text response.
---

## Overview
Run large language models on Replicate for text generation, reasoning, and conversation.

## What this skill does
Takes a text prompt, runs a language model, and returns the generated text response.

## Usage
- `prompt` (required): The text prompt or question
- `model` (optional): Replicate model ID (defaults to `openai/gpt-4o`)
- `input` (optional): Additional model-specific parameters (e.g. `system_prompt`, `temperature`, `max_tokens`)

## Examples
- Simple: `{ prompt: "Explain quantum computing in simple terms" }`
- With model: `{ prompt: "Write a haiku about coding", model: "deepseek-ai/deepseek-r1" }`
- With params: `{ prompt: "List 5 ideas", model: "google/gemini-3-flash", input: { temperature: 0.9 } }`
