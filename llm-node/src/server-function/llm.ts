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

  const {
    userMessage,
    llmModel,
  }: {
    userMessage: string;
    llmModel: string;
  } = await req.json();

  const model = new ChatOpenAI({
    model: llmModel,
    temperature: 0.95,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const resultStream = await model.stream(userMessage);

  return new Response(resultStream, {
    headers: { "Content-Type": "application/json" },
  });
}
