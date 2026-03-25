/**
 * @typedef {Object} Input - An incoming WhatsApp message payload.
 * @property {string} from - The sender's phone number.
 * @property {string} text - The message text content.
 * @property {string} [name] - The sender's WhatsApp profile name.
 * @property {string} [timestamp] - The message timestamp.
 * @property {string} [messageId] - The WhatsApp message ID.
 */
type Input = {
  from: string;
  text: string;
  name?: string;
  timestamp?: string;
  messageId?: string;
};

/**
 * @typedef {Object} Output - The processed incoming message result.
 * @property {boolean} success - Whether the message was processed successfully.
 * @property {string} from - The sender's phone number.
 * @property {string} text - The message text content.
 * @property {string} [name] - The sender's profile name.
 * @property {string} [timestamp] - The message timestamp.
 * @property {string} [messageId] - The WhatsApp message ID.
 */
type Output = {
  success: boolean;
  from: string;
  text: string;
  name?: string;
  timestamp?: string;
  messageId?: string;
};

/**
 * Process an incoming WhatsApp message from the webhook.
 *
 * @param {Input} input - The incoming message data.
 *
 * @returns {Output} The processed message result.
 */
export default function receiveMessage({
  from,
  text,
  name,
  timestamp,
  messageId,
}: Input): Output {
  return {
    success: true,
    from,
    text,
    name,
    timestamp,
    messageId,
  };
}
