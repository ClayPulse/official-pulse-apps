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
 * @property {string} artifactUrl - The URL of the prediction's primary output artifact.
 * @property {string} [error] - Error message if the prediction failed.
 */
type Output = {
  artifactUrl: string;
  error?: string;
};

/**
 * Run any AI model on Replicate and return the artifact URL.
 *
 * @param {Input} input - The model identifier and input parameters.
 *
 * @returns {Promise<Output>} The artifact URL from the prediction result.
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
      artifactUrl: "",
      error: data.details || data.error || "Unknown error",
    };
  }

  // Extract the primary artifact URL from the output
  const output = data.output;
  const artifactUrl = Array.isArray(output) ? output[0] : typeof output === "string" ? output : "";

  return { artifactUrl };
}
