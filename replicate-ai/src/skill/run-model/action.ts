/**
 * @typedef {Object} Input - The input parameters for running a Replicate model.
 * @property {string} model - The Replicate model identifier (e.g. "black-forest-labs/flux-schnell").
 * @property {Record<string, any>} input - The model-specific input parameters.
 */
type Input = {
  model: string;
  input: Record<string, any>;
};

/**
 * @typedef {Object} Output - The output of the Replicate prediction.
 * @property {string} id - The prediction ID.
 * @property {string} status - The prediction status (succeeded, failed, canceled).
 * @property {any} output - The model output (format varies by model).
 * @property {Record<string, any>} [metrics] - Prediction metrics (run time, etc.).
 * @property {string} [error] - Error message if the prediction failed.
 */
type Output = {
  id: string;
  status: string;
  output: any;
  metrics?: Record<string, any>;
  error?: string;
};

/**
 * Run any AI model on Replicate. Provide the model identifier and its input parameters.
 * The output format depends on the model (image URLs, text, audio URLs, etc.).
 *
 * @param {Input} input - The model identifier and input parameters.
 *
 * @returns {Promise<Output>} The prediction result from Replicate.
 */
export default async function runModel({ model, input }: Input): Promise<Output> {
  const res = await fetch("/server-function/run-prediction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      id: data.prediction?.id ?? "",
      status: "failed",
      output: null,
      error: data.error || "Unknown error",
    };
  }

  return {
    id: data.id,
    status: data.status,
    output: data.output,
    metrics: data.metrics,
  };
}
