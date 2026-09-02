import { describe, expect, it } from "vitest";

import {
  classifyIntegrationError,
  PermanentIntegrationError,
  TransientIntegrationError,
} from "@/domain/retry";

describe("integration retry policy", () => {
  it("retries only classified transient errors", () => {
    expect(
      classifyIntegrationError(
        new TransientIntegrationError("TIMEOUT", "Geçici hata"),
      ),
    ).toEqual({
      retryable: true,
      code: "TIMEOUT",
      safeMessage: "Geçici hata",
    });
    expect(
      classifyIntegrationError(
        new PermanentIntegrationError("AUTH", "Yetki hatası"),
      ).retryable,
    ).toBe(false);
    expect(classifyIntegrationError(new Error("secret raw failure"))).toEqual({
      retryable: false,
      code: "INTEGRATION_UNKNOWN",
      safeMessage:
        "Entegrasyon işlemi tamamlanamadı. Destek ekibine iş kimliğini iletin.",
    });
  });
});
