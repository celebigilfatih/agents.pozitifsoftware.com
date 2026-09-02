import { describe, expect, it } from "vitest";

import { assertSameOrigin } from "@/lib/api";

describe("same-origin guard", () => {
  it("accepts the canonical app host behind an internal reverse-proxy host", () => {
    expect(() =>
      assertSameOrigin(
        new Request("http://internal-web:3000/api/v1/commands", {
          headers: { origin: "http://localhost:3000" },
        }),
      ),
    ).not.toThrow();
  });

  it("rejects an unrelated origin", () => {
    expect(() =>
      assertSameOrigin(
        new Request("http://internal-web:3000/api/v1/commands", {
          headers: { origin: "https://attacker.example" },
        }),
      ),
    ).toThrow("İstek kaynağı doğrulanamadı");
  });
});
