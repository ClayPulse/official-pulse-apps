/**
 * @typedef {Object} Input
 * @property {string} text - The text input from UI.
 */
type Input = {
  text: string;
};

/**
 * Process the input text from UI. This action is for processing input only and does not produce any output.
 * @param {Input} input - The input containing the text from UI.
 */
export default function inputText({ text }: Input) {
  // Noop for action as this is not processing any output
  return {};
}
