/**
 * @typedef {Object} input - The input parameters for the action.
 * @property {string} key - The key for the object.
 * @property {any} value - The value associated with the key.
 */
type Input = {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

/**
 * @typedef {Object} output - The output of the action.
 * @property {any} result - The resulting object.
 */
type Output = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
};

/**
 * Creates an object from the given key and value.
 *
 * @param {Input} input - The input parameters.
 *
 * @returns {Output} The output of the action.
 */
export default function createObject({ key, value }: Input): Output {
  const result = { [key]: value };
  return { result };
}
