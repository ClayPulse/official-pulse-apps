---
name: receive-message
description: Process an incoming WhatsApp message received via webhook
input_schema:
  type: object
  properties:
    from:
      type: string
      description: The sender's phone number
    text:
      type: string
      description: The message text content
    name:
      type: string
      description: The sender's WhatsApp profile name
    timestamp:
      type: string
      description: The message timestamp
    messageId:
      type: string
      description: The WhatsApp message ID
  required:
    - from
    - text
---

# Receive WhatsApp Message

Process an incoming WhatsApp message received via the webhook. This skill is triggered when a new message arrives through the WhatsApp Business API webhook.

## Usage

This skill is typically triggered automatically by the webhook server function when a new message is received. It can also be invoked by an AI agent or workflow to process a specific incoming message.
