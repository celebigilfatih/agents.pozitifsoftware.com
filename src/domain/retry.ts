export type RetryDecision = {
  retryable: boolean;
  code: string;
  safeMessage: string;
};

export function classifyIntegrationError(error: unknown): RetryDecision {
  if (error instanceof PermanentIntegrationError) {
    return {
      retryable: false,
      code: error.code,
      safeMessage: error.safeMessage,
    };
  }
  if (error instanceof TransientIntegrationError) {
    return {
      retryable: true,
      code: error.code,
      safeMessage: error.safeMessage,
    };
  }
  return {
    retryable: false,
    code: "INTEGRATION_UNKNOWN",
    safeMessage:
      "Entegrasyon işlemi tamamlanamadı. Destek ekibine iş kimliğini iletin.",
  };
}

export class PermanentIntegrationError extends Error {
  constructor(
    public readonly code: string,
    public readonly safeMessage: string,
  ) {
    super(safeMessage);
    this.name = "PermanentIntegrationError";
  }
}

export class TransientIntegrationError extends Error {
  constructor(
    public readonly code: string,
    public readonly safeMessage: string,
  ) {
    super(safeMessage);
    this.name = "TransientIntegrationError";
  }
}
