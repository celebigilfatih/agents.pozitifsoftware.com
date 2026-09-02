export const appRoles = ["admin", "publisher", "uploader", "viewer"] as const;
export type AppRole = (typeof appRoles)[number];

export const appPermissions = [
  "upload",
  "preparePublication",
  "publish",
  "viewHistory",
  "manageUsers",
  "manageIntegrations",
] as const;
export type AppPermission = (typeof appPermissions)[number];

const matrix: Record<AppRole, ReadonlySet<AppPermission>> = {
  admin: new Set(appPermissions),
  publisher: new Set([
    "upload",
    "preparePublication",
    "publish",
    "viewHistory",
  ]),
  uploader: new Set(["upload", "preparePublication", "viewHistory"]),
  viewer: new Set(["viewHistory"]),
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && appRoles.includes(value as AppRole);
}

export function hasPermission(
  role: AppRole,
  permission: AppPermission,
): boolean {
  return matrix[role].has(permission);
}
