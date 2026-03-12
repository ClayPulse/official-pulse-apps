/**
 * @typedef {Object} Input - The input parameters for the parse-json action.
 * @property {string} stringValue - The JSON string to parse.
 */
type Input = {
  stringValue: string;
};

/**
 * @typedef {Object} Output - The output of the parse-json action.
 * @property {object} parsedObject - The parsed JSON object.
 */
type Output = {
  parsedObject: object;
};

/**
 * Parses a JSON string into a JSON object.
 *
 * @param {Input} input - The input parameters.
 * @returns {Output} The parsed result.
 */
export default function parseJson({ stringValue }: Input): Output {
  const parsedObject = JSON.parse(stringValue);
  return { parsedObject };
}
