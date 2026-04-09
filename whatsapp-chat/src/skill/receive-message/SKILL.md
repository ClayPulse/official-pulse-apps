---
name: receive-message
description: Process an incoming WhatsApp webhook payload and extract messages
input_schema:
  type: object
  properties:
    object:
      type: string
      description: The webhook object type (e.g. "whatsapp_business_account")
    entry:
      type: array
      description: The webhook entry array containing changes
      items:
        type: object
        properties:
          id:
            type: string
          changes:
            type: array
            items:
              type: object
              properties:
                field:
                  type: string
                value:
                  type: object
  required:
    - object
    - entry
---

# Receive WhatsApp Message

Process a raw WhatsApp Business API webhook payload and extract incoming messages. This skill is triggered when a new message arrives through the webhook.

## Usage

This skill is typically triggered automatically by the webhook server function when a new message is received. It can also be invoked by an AI agent or workflow to process a specific webhook payload.
