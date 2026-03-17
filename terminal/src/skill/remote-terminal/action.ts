/**
 * @typedef {Object} Input - The input parameters for the remote-terminal action.
 * @property {string} websocketUrl - The WebSocket URL to connect to the remote terminal.
 */
type Input = {
  websocketUrl: string;
};

/**
 * @typedef {Object} Output - The output of the remote-terminal action.
 */
type Output = Record<string, never>;

/**
 * Opens a remote terminal via WebSocket connection.
 *
 * @param {Input} input - The input parameters for the remote-terminal action.
 *
 * @returns {Output} Empty result.
 */
export default function remoteTerminal({ websocketUrl }: Input): Output {
  return {};
}
