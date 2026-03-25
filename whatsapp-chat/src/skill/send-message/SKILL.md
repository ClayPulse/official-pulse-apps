---
name: send-message
description: Send a WhatsApp message to a phone number
input_schema:
  type: object
  properties:
    to:
      type: string
      description: The recipient phone number in international format (e.g. 14155552671)
    message:
      type: string
      description: The text message to send
  required:
    - to
    - message
---

# Send WhatsApp Message

Send a text message to a WhatsApp user via the WhatsApp Business Cloud API.

## Usage

Provide the recipient's phone number in international format (without the + sign) and the message text. The user must be authenticated with Meta/WhatsApp before using this skill.
