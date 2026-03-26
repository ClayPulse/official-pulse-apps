/**
 * @typedef {Object} Input - Input parameters for image processing tools.
 * @property {string} image - URL of the image to process.
 * @property {string} model - Replicate model ID for the image tool.
 * @property {Record<string, any>} [input] - Additional model-specific parameters.
 */
type Input = {
  image: string;
  model: string;
  input?: Record<string, any>;
};

/**
 * @typedef {Object} Output - The output of the image tool.
 * @property {string} id - The prediction ID.
 * @property {string} status - The prediction status.
 * @property {any} output - The processed image URLs or data.
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
 * Process an image using an AI tool on Replicate (upscale, remove background, etc.).
 *
 * @param {Input} input - The image URL, model, and optional extra parameters.
 *
 * @returns {Promise<Output>} The prediction result with processed image.
 */
export default async function imageTools({
  image,
  model,
  input: extraInput = {},
}: Input): Promise<Output> {
  const res = await fetch("/server-function/run-prediction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: { image, ...extraInput } }),
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
