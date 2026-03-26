/**
 * @typedef {Object} Input - Input parameters for video processing tools.
 * @property {string} model - Replicate model ID for the video tool.
 * @property {Record<string, any>} input - Model-specific parameters (video_url, audio, etc.).
 */
type Input = {
  model: string;
  input: Record<string, any>;
};

/**
 * @typedef {Object} Output - The output of the video tool.
 * @property {string} id - The prediction ID.
 * @property {string} status - The prediction status.
 * @property {any} output - The processed video URLs or data.
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
 * Process a video using an AI tool on Replicate (lip sync, translate, upscale, etc.).
 *
 * @param {Input} input - The model and model-specific parameters.
 *
 * @returns {Promise<Output>} The prediction result with processed video.
 */
export default async function videoTools({
  model,
  input,
}: Input): Promise<Output> {
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
