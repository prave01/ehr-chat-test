export const EHR_TOKEN_EXPIRED = "EHR_TOKEN_EXPIRED";
export const EHR_API_KEY_REQUIRED = "EHR_API_KEY_REQUIRED";

export class EhrTokenExpiredError extends Error {
  constructor() {
    super(EHR_TOKEN_EXPIRED);
    this.name = "EhrTokenExpiredError";
  }
}

export class EhrApiKeyRequiredError extends Error {
  constructor() {
    super(EHR_API_KEY_REQUIRED);
    this.name = "EhrApiKeyRequiredError";
  }
}
