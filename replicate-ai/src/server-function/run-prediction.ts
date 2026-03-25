/**
 * Server function that creates and polls a Replicate prediction.
 * POST body: { model: string, input: Record<string, any> }
 * Returns the Replicate prediction output once complete.
 */
export default async function runPrediction(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return new Response(
      JSON.stringify({ error: "REPLICATE_API_TOKEN is not configured" }),
      { status: 500 },
    );
  }

  const { model, input } = await req.json();
  if (!model || !input) {
    return new Response(
      JSON.stringify({ error: "model and input are required" }),
      { status: 400 },
    );
  }

  // Use the model-specific predictions endpoint which doesn't require a version hash.
  // Format: POST /v1/models/{owner}/{name}/predictions
  const createRes = await fetch(
    `https://api.replicate.com/v1/models/${model}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({ input }),
    },
  );

  if (!createRes.ok) {
    const errBody = await createRes.text();
    return new Response(
      JSON.stringify({ error: `Replicate API error: ${createRes.status}`, details: errBody }),
      { status: createRes.status },
    );
  }

  const prediction = await createRes.json();

  // If "Prefer: wait" returned a completed prediction, return it directly
  if (prediction.status === "succeeded") {
    return new Response(JSON.stringify(prediction), { status: 200 });
  }

  if (prediction.status === "failed" || prediction.status === "canceled") {
    return new Response(
      JSON.stringify({ error: `Prediction ${prediction.status}`, prediction }),
      { status: 422 },
    );
  }

  // Poll for completion
  const getUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    const pollData = await pollRes.json();

    if (pollData.status === "succeeded") {
      return new Response(JSON.stringify(pollData), { status: 200 });
    }
    if (pollData.status === "failed" || pollData.status === "canceled") {
      return new Response(
        JSON.stringify({ error: `Prediction ${pollData.status}`, prediction: pollData }),
        { status: 422 },
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Prediction timed out" }),
    { status: 504 },
  );
}
