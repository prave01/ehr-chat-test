export type AgentErrorCode =
  | "token_expired"
  | "api_key_required"
  | "missing_openrouter_key"
  | "missing_ehr_base_url"
  | "agent_failed";

export type RunAgentResult =
  | { ok: true; text: string }
  | { ok: false; code: AgentErrorCode; message: string };
