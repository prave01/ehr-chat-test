import { AsyncLocalStorage } from "async_hooks";
import { EhrApiKeyRequiredError, EhrTokenExpiredError } from "./errors";

export type EhrAuthFailure = "expired" | "missing";

type EhrContext = {
  apiKey?: string;
  authFailure?: EhrAuthFailure;
};

const ehrContext = new AsyncLocalStorage<EhrContext>();

export function runWithEhrApiKey<T>(
  apiKey: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const trimmed = apiKey?.trim();
  return ehrContext.run({ apiKey: trimmed || undefined }, fn);
}

export function getEhrAuthFailure(): EhrAuthFailure | undefined {
  return ehrContext.getStore()?.authFailure;
}

function markAuthFailure(failure: EhrAuthFailure) {
  const store = ehrContext.getStore();
  if (store) {
    store.authFailure = failure;
  }
}

function resolveApiKey(): string {
  const fromRequest = ehrContext.getStore()?.apiKey;
  const key = fromRequest || process.env.EHR_TEMP_KEY;
  if (!key) {
    markAuthFailure("missing");
    throw new EhrApiKeyRequiredError();
  }
  return key;
}

export async function ehrFetch(
  input: string | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${resolveApiKey()}`);

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401 || response.status === 403) {
    markAuthFailure("expired");
    throw new EhrTokenExpiredError();
  }

  return response;
}

export function isEhrAuthError(
  error: unknown,
): error is EhrTokenExpiredError | EhrApiKeyRequiredError {
  return (
    error instanceof EhrTokenExpiredError ||
    error instanceof EhrApiKeyRequiredError
  );
}
