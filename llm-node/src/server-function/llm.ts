import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();
/**
 *  An example function to echo the body of a POST request.
 *  This route is accessible at /server-function/echo
 */
export default async function agent(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const {
      prompt,
      llmModel,
    }: {
      prompt: string;
      llmModel: string;
    } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error:
            "OPENAI_API_KEY is missing. Add it to your environment and try again.",
        },
        { status: 500 },
      );
    }

    const model = new ChatOpenAI({
      model: llmModel,
      apiKey: process.env.OPENAI_API_KEY,
    });

    const llmStream = await model.stream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of llmStream) {
          const text = chunk.text;
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "LLM request failed.";

    return Response.json({ error: message }, { status: 500 });
  }
}
