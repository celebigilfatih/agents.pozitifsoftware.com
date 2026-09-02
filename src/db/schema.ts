import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    role: text("role").notNull().default("viewer"),
    banned: boolean("banned").notNull().default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", { withTimezone: true }),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_id_idx").on(table.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("account_issuer_account_id_unique").on(
      table.issuer,
      table.accountId,
    ),
    index("account_user_id_idx").on(table.userId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const targetTypeEnum = pgEnum("target_type", [
  "group",
  "player",
  "playlist",
]);
export const assetStatusEnum = pgEnum("asset_status", [
  "uploaded",
  "transferred",
  "expired",
  "failed",
]);
export const commandStatusEnum = pgEnum("command_status", [
  "draft",
  "needs_clarification",
  "awaiting_confirmation",
  "queued",
  "cancelled",
]);
export const publicationStatusEnum = pgEnum("publication_status", [
  "queued",
  "uploading",
  "updating_playlist",
  "publishing",
  "completed",
  "failed",
  "cancelled",
]);

export const userTargetPermission = pgTable(
  "user_target_permission",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: targetTypeEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    targetName: text("target_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_target_permission_unique").on(
      table.userId,
      table.targetType,
      table.targetId,
    ),
    index("user_target_permission_user_idx").on(table.userId),
  ],
);

export const uploadedAsset = pgTable(
  "uploaded_asset",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    originalFileName: text("original_file_name").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    checksumSha256: text("checksum_sha256").notNull(),
    durationSeconds: integer("duration_seconds"),
    status: assetStatusEnum("status").notNull().default("uploaded"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uploaded_asset_storage_key_unique").on(table.storageKey),
    index("uploaded_asset_owner_idx").on(table.ownerId),
    index("uploaded_asset_expiry_idx").on(table.expiresAt),
  ],
);

export const commandRequest = pgTable(
  "command_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    uploadedAssetId: uuid("uploaded_asset_id")
      .notNull()
      .references(() => uploadedAsset.id, { onDelete: "restrict" }),
    originalInstruction: text("original_instruction").notNull(),
    status: commandStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("command_request_user_idx").on(table.userId)],
);

export const parsedIntent = pgTable(
  "parsed_intent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    commandRequestId: uuid("command_request_id")
      .notNull()
      .references(() => commandRequest.id, { onDelete: "cascade" }),
    schemaVersion: integer("schema_version").notNull().default(1),
    payload: jsonb("payload").notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("parsed_intent_command_unique").on(table.commandRequestId),
  ],
);

export const publicationJob = pgTable(
  "publication_job",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    commandRequestId: uuid("command_request_id")
      .notNull()
      .references(() => commandRequest.id, { onDelete: "restrict" }),
    requestedById: text("requested_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    approvedById: text("approved_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    idempotencyKey: text("idempotency_key").notNull(),
    status: publicationStatusEnum("status").notNull().default("queued"),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    lastErrorCode: text("last_error_code"),
    safeErrorMessage: text("safe_error_message"),
    navoriResult: jsonb("navori_result"),
    approvedAt: timestamp("approved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("publication_job_idempotency_unique").on(table.idempotencyKey),
    uniqueIndex("publication_job_command_unique").on(table.commandRequestId),
    index("publication_job_status_idx").on(table.status),
  ],
);

export const publicationTarget = pgTable(
  "publication_target",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicationJobId: uuid("publication_job_id")
      .notNull()
      .references(() => publicationJob.id, { onDelete: "cascade" }),
    targetType: targetTypeEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    targetName: text("target_name").notNull(),
    screenCount: integer("screen_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("publication_target_job_idx").on(table.publicationJobId)],
);

export const auditEvent = pgTable(
  "audit_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    commandRequestId: uuid("command_request_id").references(
      () => commandRequest.id,
      {
        onDelete: "set null",
      },
    ),
    publicationJobId: uuid("publication_job_id").references(
      () => publicationJob.id,
      {
        onDelete: "set null",
      },
    ),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    requestId: text("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_event_job_idx").on(table.publicationJobId),
    index("audit_event_created_idx").on(table.createdAt),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  targetPermissions: many(userTargetPermission),
  uploadedAssets: many(uploadedAsset),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));
