/**
 * @typedef {Object} Input - The input parameters for the stringify-json action.
 * @property {any} jsonObject - The JSON object to stringify.
 */
type Input = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsonObject: any;
};

/**
 * @typedef {Object} Output - The output of the stringify-json action.
 * @property {string} stringValue - The resulting JSON string.
 */
type Output = {
  stringValue: string;
};

/**
 * Converts a JSON object into a pretty-printed JSON string.
 *
 * @param {Input} input - The input parameters.
 * @returns {Output} The stringified result.
 */
export default function stringifyJson({ jsonObject }: Input): Output {
  const stringValue = JSON.stringify(jsonObject, null, 2);
  return { stringValue };
}
