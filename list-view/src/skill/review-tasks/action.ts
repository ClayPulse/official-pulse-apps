/**
 * @typedef {Object} Input - The input parameters for the review tasks action.
 * @property {string} items - A JSON-encoded array of task item objects. Each item can have properties like type, name, description, status, url, and any additional fields.
 */
type Input = {
  items: Record<string, unknown>[];
};

/**
 * @typedef {Object} Output - The output of the review tasks action.
 * @property {string} items - A JSON-encoded array of the reviewed task items, passed through as-is.
 */
type Output = {
  items: Record<string, unknown>[];
};

/**
 * Accepts a list of task items for human review and returns them as-is.
 * The purpose is to present items to the user for approval before further processing.
 *
 * @param {Input} input - The input containing the list of task items.
 *
 * @returns {Output} The same list of task items passed through.
 */
export default function reviewTasks({ items }: Input): Output {
  return { items };
}
