import fs from "fs";
import path from "path";

export function getSystemPrompt(): string {
  const filePath = path.join(process.cwd(), "lib/prompts/ehr_system_prompt.md");
  return fs.readFileSync(filePath, "utf-8");
}
