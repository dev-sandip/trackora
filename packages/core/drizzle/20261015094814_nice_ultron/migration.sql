CREATE TYPE "agent_status" AS ENUM('online', 'offline', 'busy', 'away');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'user'::"user_role" NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp(3) with time zone NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "agent_status" DEFAULT 'offline'::"agent_status" NOT NULL,
	"location_lat" double precision,
	"location_lng" double precision,
	"location_address" text,
	"location_accuracy" double precision,
	"location_timestamp" timestamp(3) with time zone,
	"last_seen" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uidx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" ("role");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_uidx" ON "sessions" ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" ("expires_at");--> statement-breakpoint
CREATE INDEX "agents_user_id_idx" ON "agents" ("user_id");--> statement-breakpoint
CREATE INDEX "agents_status_idx" ON "agents" ("status");--> statement-breakpoint
CREATE INDEX "agents_last_seen_idx" ON "agents" ("last_seen");--> statement-breakpoint
CREATE INDEX "agents_user_status_idx" ON "agents" ("user_id","status");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;