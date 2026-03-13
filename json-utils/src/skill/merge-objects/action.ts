/**
 * @typedef {Object} input - The input parameters for the action.
 * @property {any} objectA - The first object to merge.
 * @property {any} objectB - The second object to merge.
 */
type Input = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objectA: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objectB: any;
};

/**
 * @typedef {Object} output - The output of the action.
 * @property {any} result - The merged result.
 */
type Output = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
};

/**
 * Merges two objects into one.
 *
 * @param {Input} input - The input parameters.
 *
 * @returns {Output} The output of the action.
 */
export default function mergeObjects({ objectA, objectB }: Input): Output {
  const result = { ...objectA, ...objectB };
  return { result };
}
