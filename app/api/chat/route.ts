import { convertToModelMessages, streamText, UIMessage } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { tools } from "@/app/agent";
import { createOllama } from "ollama-ai-provider-v2";

const modelName = "google/gemma-4-31b-it:free";
const ollamaModel = "gemma4:e2b"

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_KEY!,
});

const ollama = createOllama()

export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();

    const result = streamText({
      model: openrouter.languageModel(modelName),
      messages: await convertToModelMessages(messages),
      system:
        "You are an EHR assistant. Be concise, clinically grounded, and clearly label uncertainty.",
      tools:tools,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate chat response.";

    return Response.json({ error: message }, { status: 500 });
  }
}
