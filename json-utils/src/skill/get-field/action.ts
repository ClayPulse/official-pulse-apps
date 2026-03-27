/**
 * @typedef {Object} Input - The input parameters for the get-field action.
 * @property {any} jsonObject - The JSON object to access.
 * @property {string} key - The key of the field to retrieve.
 */
type Input = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsonObject: any;
  key: string;
};

/**
 * @typedef {Object} Output - The output of the get-field action.
 * @property {any} value - The value of the field.
 */
type Output = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

/**
 * Retrieves the value of a field from a JSON object by key.
 *
 * @param {Input} input - The input parameters.
 * @returns {Output} The field value.
 */
export default function getField({ jsonObject, key }: Input): Output {
  const value = jsonObject[key];
  return { value };
}
