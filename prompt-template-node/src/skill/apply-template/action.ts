/**
 * @typedef {Object} Input - The input parameters for the apply-template action.
 * @property {string} template - The prompt template string with {varName} placeholders.
 * @property {Record<string, string>} variables - An object mapping variable names to their replacement values.
 */
type Input = {
  template: string;
  variables: Record<string, string>;
};

/**
 * @typedef {Object} Output - The output of the apply-template action.
 * @property {string} result - The template with all placeholders replaced.
 */
type Output = {
  result: string;
};

/**
 * Replaces {varName} placeholders in a prompt template with values from the variables object.
 *
 * @param {Input} input - The template and variables to apply.
 *
 * @returns {Output} The result with placeholders replaced.
 */
export default function applyTemplate({ template, variables }: Input): Output {
  const result = template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in variables ? variables[key] : match;
  });
  return { result };
}
