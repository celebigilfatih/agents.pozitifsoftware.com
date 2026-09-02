import { describe, expect, it } from "vitest";

import { hasPermission, isAppRole } from "@/lib/auth/permissions";

describe("role permission matrix", () => {
  it("grants only administrators user management", () => {
    expect(hasPermission("admin", "manageUsers")).toBe(true);
    expect(hasPermission("publisher", "manageUsers")).toBe(false);
    expect(hasPermission("uploader", "manageUsers")).toBe(false);
    expect(hasPermission("viewer", "manageUsers")).toBe(false);
  });

  it("keeps publication approval away from uploader and viewer", () => {
    expect(hasPermission("publisher", "publish")).toBe(true);
    expect(hasPermission("uploader", "publish")).toBe(false);
    expect(hasPermission("viewer", "publish")).toBe(false);
  });

  it("rejects unknown persisted roles", () => {
    expect(isAppRole("owner")).toBe(false);
    expect(isAppRole("admin")).toBe(true);
  });
});
