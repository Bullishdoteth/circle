CREATE TYPE "circle_member_role" AS ENUM('owner', 'admin', 'treasurer', 'member');--> statement-breakpoint
CREATE TYPE "circle_status" AS ENUM('active', 'archived', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "circle_visibility" AS ENUM('private', 'invite_only');--> statement-breakpoint
CREATE TYPE "currency" AS ENUM('NGN');--> statement-breakpoint
CREATE TYPE "invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "invitation_type" AS ENUM('email', 'link', 'code');--> statement-breakpoint
CREATE TYPE "membership_status" AS ENUM('active', 'suspended', 'removed');--> statement-breakpoint
CREATE TABLE "circle_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"circle_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "circle_member_role" DEFAULT 'member'::"circle_member_role" NOT NULL,
	"status" "membership_status" DEFAULT 'active'::"membership_status" NOT NULL,
	"invited_by" uuid,
	"accepted_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"currency" "currency" DEFAULT 'NGN'::"currency" NOT NULL,
	"owner_id" uuid NOT NULL,
	"visibility" "circle_visibility" DEFAULT 'invite_only'::"circle_visibility" NOT NULL,
	"status" "circle_status" DEFAULT 'active'::"circle_status" NOT NULL,
	"created_by" uuid NOT NULL,
	"last_activity_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"circle_id" uuid NOT NULL,
	"invited_by" uuid,
	"invited_user_id" uuid,
	"email" text NOT NULL,
	"message" text,
	"token" text NOT NULL UNIQUE,
	"type" "invitation_type" DEFAULT 'email'::"invitation_type" NOT NULL,
	"role" "circle_member_role" DEFAULT 'member'::"circle_member_role" NOT NULL,
	"status" "invitation_status" DEFAULT 'pending'::"invitation_status" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "unique_membership" ON "circle_members" ("circle_id","user_id");--> statement-breakpoint
CREATE INDEX "circle_member_circle_idx" ON "circle_members" ("circle_id");--> statement-breakpoint
CREATE INDEX "circle_member_user_idx" ON "circle_members" ("user_id");--> statement-breakpoint
CREATE INDEX "circle_owner_idx" ON "circles" ("owner_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitations" ("email");--> statement-breakpoint
CREATE INDEX "invitation_circle_idx" ON "invitations" ("circle_id");--> statement-breakpoint
CREATE INDEX "invitation_invited_user_idx" ON "invitations" ("invited_user_id");--> statement-breakpoint
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_circle_id_circles_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_invited_by_users_id_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "circles" ADD CONSTRAINT "circles_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "circles" ADD CONSTRAINT "circles_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_circle_id_circles_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_user_id_users_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE SET NULL;