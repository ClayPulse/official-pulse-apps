/**
 * @typedef {Object} Input - The input parameters for sending an email.
 * @property {string} to - The recipient email address.
 * @property {string} subject - The email subject line.
 * @property {string} [apiKey] - The Resend API key (optional, uses Pulse Editor managed service if omitted).
 * @property {string} [provider] - The email provider to use: "gmail" for Gmail OAuth, omit for Resend/managed.
 * @property {string} [from] - The sender email address (defaults to onboarding@resend.dev).
 * @property {string} [html] - The HTML body of the email.
 * @property {string} [text] - The plain text body of the email.
 */
type Input = {
  to: string;
  subject: string;
  apiKey?: string;
  provider?: string;
  from?: string;
  html?: string;
  text?: string;
};

/**
 * @typedef {Object} Output - The output of the send email action.
 * @property {boolean} success - Whether the email was sent successfully.
 * @property {string} [id] - The Resend email ID if successful.
 * @property {string} [error] - Error message if the email failed to send.
 */
type Output = {
  success: boolean;
  id?: string;
  error?: string;
};

/**
 * Send an email using the Resend API via the server function.
 * If no apiKey is provided, the Pulse Editor managed email service is used.
 *
 * @param {Input} input - The input parameters for sending the email.
 *
 * @returns {Output} The result of the email send operation.
 */
export default async function sendEmail({
  to,
  subject,
  apiKey,
  provider,
  from,
  html,
  text,
}: Input): Promise<Output> {
  const response = await fetch("/server-function/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      subject,
      ...(apiKey ? { apiKey } : {}),
      ...(provider ? { provider } : {}),
      ...(from ? { from } : {}),
      ...(html ? { html } : { text: text || "" }),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: JSON.stringify(data.error) };
  }

  return { success: true, id: data.id };
}
