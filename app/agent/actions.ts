"use server";

import type { UIMessage } from "ai";
import { runAgentInternal } from "./run-agent";
import type { RunAgentResult } from "./result";

export async function runAgent(
  messages: UIMessage[],
  apiKey?: string,
): Promise<RunAgentResult> {
  return runAgentInternal(messages, apiKey);
}
