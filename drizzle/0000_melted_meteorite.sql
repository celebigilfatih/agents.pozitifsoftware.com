CREATE TYPE "public"."asset_status" AS ENUM('uploaded', 'transferred', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."command_status" AS ENUM('draft', 'needs_clarification', 'awaiting_confirmation', 'queued', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('queued', 'uploading', 'updating_playlist', 'publishing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."target_type" AS ENUM('group', 'player', 'playlist');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"command_request_id" uuid,
	"publication_job_id" uuid,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "command_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"uploaded_asset_id" uuid NOT NULL,
	"original_instruction" text NOT NULL,
	"status" "command_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parsed_intent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"command_request_id" uuid NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"payload" jsonb NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publication_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"command_request_id" uuid NOT NULL,
	"requested_by_id" text NOT NULL,
	"approved_by_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" "publication_status" DEFAULT 'queued' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"last_error_code" text,
	"safe_error_message" text,
	"navori_result" jsonb,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publication_target" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publication_job_id" uuid NOT NULL,
	"target_type" "target_type" NOT NULL,
	"target_id" text NOT NULL,
	"target_name" text NOT NULL,
	"screen_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text
);
--> statement-breakpoint
CREATE TABLE "uploaded_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"original_file_name" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum_sha256" text NOT NULL,
	"duration_seconds" integer,
	"status" "asset_status" DEFAULT 'uploaded' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_target_permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"target_type" "target_type" NOT NULL,
	"target_id" text NOT NULL,
	"target_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_command_request_id_command_request_id_fk" FOREIGN KEY ("command_request_id") REFERENCES "public"."command_request"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_publication_job_id_publication_job_id_fk" FOREIGN KEY ("publication_job_id") REFERENCES "public"."publication_job"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "command_request" ADD CONSTRAINT "command_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "command_request" ADD CONSTRAINT "command_request_uploaded_asset_id_uploaded_asset_id_fk" FOREIGN KEY ("uploaded_asset_id") REFERENCES "public"."uploaded_asset"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parsed_intent" ADD CONSTRAINT "parsed_intent_command_request_id_command_request_id_fk" FOREIGN KEY ("command_request_id") REFERENCES "public"."command_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_job" ADD CONSTRAINT "publication_job_command_request_id_command_request_id_fk" FOREIGN KEY ("command_request_id") REFERENCES "public"."command_request"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_job" ADD CONSTRAINT "publication_job_requested_by_id_user_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_job" ADD CONSTRAINT "publication_job_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_target" ADD CONSTRAINT "publication_target_publication_job_id_publication_job_id_fk" FOREIGN KEY ("publication_job_id") REFERENCES "public"."publication_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_asset" ADD CONSTRAINT "uploaded_asset_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_target_permission" ADD CONSTRAINT "user_target_permission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_event_job_idx" ON "audit_event" USING btree ("publication_job_id");--> statement-breakpoint
CREATE INDEX "audit_event_created_idx" ON "audit_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "command_request_user_idx" ON "command_request" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "parsed_intent_command_unique" ON "parsed_intent" USING btree ("command_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publication_job_idempotency_unique" ON "publication_job" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "publication_job_command_unique" ON "publication_job" USING btree ("command_request_id");--> statement-breakpoint
CREATE INDEX "publication_job_status_idx" ON "publication_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "publication_target_job_idx" ON "publication_target" USING btree ("publication_job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uploaded_asset_storage_key_unique" ON "uploaded_asset" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "uploaded_asset_owner_idx" ON "uploaded_asset" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "uploaded_asset_expiry_idx" ON "uploaded_asset" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_target_permission_unique" ON "user_target_permission" USING btree ("user_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "user_target_permission_user_idx" ON "user_target_permission" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");