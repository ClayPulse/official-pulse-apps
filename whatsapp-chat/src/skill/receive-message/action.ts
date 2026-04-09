/**
 * @typedef {Object} Input - The raw WhatsApp webhook payload.
 * @property {string} object - The webhook object type (e.g. "whatsapp_business_account").
 * @property {Array} entry - The webhook entry array containing changes.
 */
type Input = {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        contacts?: Array<{ wa_id: string; profile?: { name?: string } }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          [key: string]: unknown;
        }>;
        [key: string]: unknown;
      };
    }>;
  }>;
};

/**
 * @typedef {Object} Output - The parsed incoming message result.
 * @property {boolean} success - Whether the webhook payload was processed successfully.
 * @property {string} from - The sender's phone number.
 * @property {string} text - The message text content.
 * @property {string} type - The message type (text, image, etc.).
 * @property {string} name - The sender's profile name.
 * @property {string} timestamp - The message timestamp.
 * @property {string} messageId - The WhatsApp message ID.
 */
type Output = {
  success: boolean;
  from?: string;
  text?: string;
  type?: string;
  name?: string;
  timestamp?: string;
  messageId?: string;
};

/**
 * Process a raw WhatsApp webhook payload and extract the incoming message.
 *
 * @param {Input} input - The raw webhook payload from WhatsApp Business API.
 *
 * @returns {Output} The parsed message extracted from the webhook payload.
 */
export default function receiveMessage(input: Input): Output {
  if (!input.entry) {
    return { success: false };
  }

  for (const entry of input.entry) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;
      const value = change.value;
      const contacts = value?.contacts || [];

      for (const msg of value?.messages || []) {
        const contact = contacts.find((c) => c.wa_id === msg.from);

        let text = "";
        switch (msg.type) {
          case "text":
            text = msg.text?.body || "";
            break;
          default:
            text = `[${msg.type || "unknown"}]`;
            break;
        }

        return {
          success: true,
          from: msg.from,
          text,
          type: msg.type,
          name: contact?.profile?.name,
          timestamp: msg.timestamp,
          messageId: msg.id,
        };
      }
    }
  }

  return { success: false };
}
