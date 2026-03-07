// Cannot be used in client?
// import { config } from "dotenv";
// config();

/**
 * @typedef {Object} input - The input parameters for the action.
 * @property {string} prompt - The prompt to send to the LLM.
 * @property {string} llmModel - The LLM model to use.
 */
type Input = {
  prompt: string;
  llmModel: string;
};

/**
 * @typedef {Object} output - The output of the action.
 * @property {string} response - The final response from the LLM.
 */
type Output = {
  response: string;
};

function extractText(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => extractText(item)).join("");
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.response === "string") {
      return record.response;
    }

    if (typeof record.content === "string") {
      return record.content;
    }

    if (typeof record.text === "string") {
      return record.text;
    }

    if (typeof record.message === "string") {
      return record.message;
    }

    if (record.content) {
      return extractText(record.content);
    }
  }

  return "";
}

/**
 * Executes the language model action with the given input parameters.
 *
 * @param {Input} input - The input parameters.
 *
 * @returns {Promise<Output>} The output of the action.
 */
export default async function runLlm({
  prompt,
  llmModel,
}: Input): Promise<Output> {
  const response = await fetch("/server-function/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userMessage: prompt,
      llmModel,
    }),
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorPayload = (await response.json()) as { error?: string };
      if (errorPayload?.error) {
        message = errorPayload.error;
      }
    } catch {
      // ignore non-JSON error responses
    }

    throw new Error(message);
  }

  if (!response.body) {
    const text = await response.text();
    return { response: text };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  let parsed = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    raw += chunk;

    try {
      const jsonChunk = JSON.parse(chunk) as unknown;
      parsed += extractText(jsonChunk);
    } catch {
      parsed += chunk;
    }
  }

  const finalRaw = raw + decoder.decode();
  const trimmedParsed = parsed.trim();

  if (trimmedParsed) {
    return { response: trimmedParsed };
  }

  try {
    const parsedPayload = JSON.parse(finalRaw) as unknown;
    const text = extractText(parsedPayload);
    return { response: text || finalRaw };
  } catch {
    return { response: finalRaw };
  }
}
