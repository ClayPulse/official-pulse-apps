/**
 * @typedef {Object} Input - The input parameters for the terminal-agent action.
 * @property {string} userMessage - The user's message that includes intent to execute a command.
 */
type Input = {
  userMessage: string;
};

/**
 * @typedef {Object} Output - The output of the terminal-agent action.
 * @property {string} response - The result of the command execution.
 */
type Output = {
  response: string;
};

/**
 * Handles a user message to execute a command in the terminal via the agent.
 *
 * @param {Input} input - The input parameters for the terminal-agent action.
 *
 * @returns {Output} The result of the command execution.
 */
export default function terminalAgent({ userMessage }: Input): Output {
  return {
    response: userMessage,
  };
}
