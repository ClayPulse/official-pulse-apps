/**
 * @typedef {Object} Input - The input parameters for the set variable action.
 * @property {unknown} value - The value to store as a variable. Can be any type.
 */
type Input = {
  value: unknown;
};

/**
 * @typedef {Object} Output - The output of the set variable action.
 * @property {unknown} value - The stored variable value, passed through unchanged.
 */
type Output = {
  value: unknown;
};

/**
 * Stores a variable value and passes it through unchanged.
 * This is a pass-through action that allows workflow nodes to save and
 * forward a value of any type to downstream nodes.
 *
 * @param {Input} input - The input parameters.
 *
 * @returns {Output} The output containing the same value.
 */
export default function setVariable({ value }: Input): Output {
  return { value };
}
