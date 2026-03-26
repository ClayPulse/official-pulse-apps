/**
 * @typedef {Object} Input - Input parameters for 3D model generation.
 * @property {string} image - URL of the reference image.
 * @property {string} [model] - Replicate model ID (defaults to "hyper3d/rodin").
 * @property {Record<string, any>} [input] - Additional model-specific parameters.
 */
type Input = {
  image: string;
  model?: string;
  input?: Record<string, any>;
};

/**
 * @typedef {Object} Output - The output of the 3D generation.
 * @property {string} id - The prediction ID.
 * @property {string} status - The prediction status.
 * @property {any} output - The generated 3D model URLs or data.
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
 * Generate a 3D model from a reference image using AI on Replicate.
 *
 * @param {Input} input - The image URL, optional model, and optional extra parameters.
 *
 * @returns {Promise<Output>} The prediction result with generated 3D model.
 */
export default async function generate3d({
  image,
  model = "hyper3d/rodin",
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
