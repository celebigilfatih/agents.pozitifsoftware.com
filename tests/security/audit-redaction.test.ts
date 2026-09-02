import { describe, expect, it } from "vitest";

import { redactForAudit } from "@/lib/audit";

describe("audit payload redaction", () => {
  it("recursively redacts common secret fields", () => {
    expect(
      redactForAudit({
        password: "visible",
        nested: { api_key: "visible", token: "visible", safe: "ok" },
      }),
    ).toEqual({
      password: "[REDACTED]",
      nested: { api_key: "[REDACTED]", token: "[REDACTED]", safe: "ok" },
    });
  });
});
