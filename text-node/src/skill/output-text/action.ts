/**
 * @typedef {Object} Output
 * @property {string} text - The text to output.
 */
type Output = {
  text: string;
};

/**
 * Output the text from UI to the action output.
 * @returns {Output} - The output containing the text from UI.
 */
export default function outputText(): Output {
  // Noop for action as this is not processing any input
  return { text: "" };
}
