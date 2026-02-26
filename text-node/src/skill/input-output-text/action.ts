/**
 * @typedef {Object} Input
 * @property {string} input-text - The text input from UI.
 */
type Input = {
  "input-text"?: string;
};

/**
 * @typedef {Object} Output
 * @property {string} output-text - The text to output, which is the same as the input text from UI.
 */
type Output = {
  "output-text"?: string;
};

/**
 * Process the input text from UI and output it. This action takes the input text from UI and outputs it without any modification.
 * @param {Input} input - The input containing the text from UI.
 * @returns {Output} - The output containing the same text from UI.
 */
export default function inputOutputText(input: Input): Output {
  return { "output-text": input["input-text"] };
}
