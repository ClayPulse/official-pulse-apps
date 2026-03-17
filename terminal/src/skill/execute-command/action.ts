/**
 * @typedef {Object} Input - The input parameters for the execute-command action.
 * @property {string} command - The command to be executed in the terminal.
 */
type Input = {
  command: string;
};

/**
 * @typedef {Object} Output - The output of the execute-command action.
 * @property {string} response - The output from the executed command.
 */
type Output = {
  response: string;
};

/**
 * Executes a command in the terminal environment.
 *
 * @param {Input} input - The input parameters for the execute-command action.
 *
 * @returns {Output} The output from the executed command.
 */
export default function executeCommand({ command }: Input): Output {
  return {
    response: command,
  };
}
