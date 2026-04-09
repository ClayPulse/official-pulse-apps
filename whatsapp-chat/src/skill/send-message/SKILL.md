---
name: send-message
description: Send a WhatsApp message to a phone number
input_schema:
  type: object
  properties:
    to:
      type: string
      description: The recipient phone number in international format (e.g. +14155552671)
    message:
      type: string
      description: The text message to send (use this for replies within an active conversation)
    template:
      type: object
      description: "A template message to send (required to initiate a new conversation). Properties: name (string), language (object with code string e.g. en_US)"
      properties:
        name:
          type: string
          description: The template name (e.g. hello_world)
        language:
          type: object
          properties:
            code:
              type: string
              description: The language code (e.g. en_US)
  required:
    - to
---

# Send WhatsApp Message

Send a message to a WhatsApp user via the WhatsApp Business Cloud API.

## Usage

Provide the recipient's phone number in international format and either a text message or a template.

- **Text message**: Use `message` to send a free-form text. This only works if the recipient has messaged you within the last 24 hours (active conversation window).
- **Template message**: Use `template` with a `name` and `language.code` to initiate a new conversation. Required when no conversation window is open.

The user must be authenticated with Meta/WhatsApp before using this skill.
