/**
 * @typedef {Object} Input - Input parameters for language model inference.
 * @property {string} prompt - The text prompt or question.
 * @property {string} [model] - Replicate model ID (defaults to "openai/gpt-4o").
 * @property {Record<string, any>} [input] - Additional model-specific parameters.
 */
type Input = {
  prompt: string;
  model?: string;
  input?: Record<string, any>;
};

/**
 * @typedef {Object} Output - The output of the language model.
 * @property {string} id - The prediction ID.
 * @property {string} status - The prediction status.
 * @property {any} output - The generated text response.
 * @property {Record<string, any>} [metrics] - Prediction metrics.
 * @property {string} [error] - Error message if failed.
 */
type Output = {
  id: string;
  status: string;
  output: any;
  metrics?: Record<string, any>;
  error?: string;
};

/**
 * Run a language model on Replicate for text generation or reasoning.
 *
 * @param {Input} input - The prompt, optional model, and optional extra parameters.
 *
 * @returns {Promise<Output>} The prediction result with generated text.
 */
export default async function languageModel({
  prompt,
  model = "openai/gpt-4o",
  input: extraInput = {},
}: Input): Promise<Output> {
  const res = await fetch("/server-function/run-prediction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: { prompt, ...extraInput } }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      id: data.prediction?.id ?? "",
      status: "failed",
      output: null,
      error: data.details || data.error || "Unknown error",
    };
  }

  return {
    id: data.id,
    status: data.status,
    output: data.output,
    metrics: data.metrics,
  };
}
