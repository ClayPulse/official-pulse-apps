/**
 * @typedef {Object} Input - The input parameters for sending a WhatsApp message.
 * @property {string} to - The recipient phone number in international format (e.g. 14155552671).
 * @property {string} message - The text message to send.
 * @property {string} [accessToken] - Optional OAuth access token (injected by frontend if available).
 * @property {string} [phoneNumberId] - Optional WhatsApp phone number ID (injected by frontend if available).
 */
type Input = {
  to: string;
  message: string;
  accessToken?: string;
  phoneNumberId?: string;
};

/**
 * @typedef {Object} Output - The output of the send message action.
 * @property {boolean} success - Whether the message was sent successfully.
 * @property {string} [messageId] - The WhatsApp message ID if successful.
 * @property {string} [error] - Error message if the send failed.
 */
type Output = {
  success: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Send a WhatsApp message to a phone number via the Cloud API.
 *
 * @param {Input} input - The input parameters for sending a WhatsApp message.
 *
 * @returns {Promise<Output>} The result of the send operation.
 */
export default async function sendMessage({
  to,
  message,
  accessToken,
  phoneNumberId,
}: Input): Promise<Output> {
  if (!accessToken || !phoneNumberId) {
    return {
      success: false,
      error:
        "Not authenticated. Please sign in via the WhatsApp Chat app first.",
    };
  }

  try {
    const res = await fetch("/server-function/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, phoneNumberId, to, message }),
    });

    const data = await res.json();

    if (!data.success) {
      return { success: false, error: data.error || "Failed to send message" };
    }

    const messageId = data.data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    return { success: false, error: `Failed to send message: ${err}` };
  }
}
