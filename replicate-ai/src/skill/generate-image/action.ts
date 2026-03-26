/**
 * @typedef {Object} Input - Input parameters for image generation.
 * @property {string} prompt - Text description of the image to generate.
 * @property {string} [model] - Replicate model ID (defaults to "black-forest-labs/flux-2-pro").
 * @property {Record<string, any>} [input] - Additional model-specific parameters.
 */
type Input = {
  prompt: string;
  model?: string;
  input?: Record<string, any>;
};

/**
 * @typedef {Object} Output - The output of the image generation.
 * @property {string} id - The prediction ID.
 * @property {string} status - The prediction status.
 * @property {any} output - The generated image URLs or data.
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
 * Generate an image using an AI model on Replicate.
 *
 * @param {Input} input - The prompt, optional model, and optional extra parameters.
 *
 * @returns {Promise<Output>} The prediction result with generated image URLs.
 */
export default async function generateImage({
  prompt,
  model = "black-forest-labs/flux-2-pro",
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
