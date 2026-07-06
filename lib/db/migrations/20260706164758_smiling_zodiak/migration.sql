CREATE TABLE "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"circle_id" uuid NOT NULL,
	"user_id" uuid,
	"amount" numeric(12,2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reference" text NOT NULL UNIQUE,
	"sender_name" text,
	"sender_bank" text,
	"sender_account_number" text,
	"round" text,
	"reconciled" boolean DEFAULT false NOT NULL,
	"reconciled_at" timestamp with time zone,
	"reconciled_by" uuid,
	"raw_payload" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"circle_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reference" text NOT NULL UNIQUE,
	"destination_bank" text NOT NULL,
	"destination_account_number" text NOT NULL,
	"destination_account_name" text NOT NULL,
	"round" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "virtual_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"circle_id" uuid NOT NULL UNIQUE,
	"account_ref" text NOT NULL UNIQUE,
	"account_name" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_account_number" text NOT NULL UNIQUE,
	"bank_account_name" text NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "contribution_circle_idx" ON "contributions" ("circle_id");--> statement-breakpoint
CREATE INDEX "contribution_user_idx" ON "contributions" ("user_id");--> statement-breakpoint
CREATE INDEX "contribution_ref_idx" ON "contributions" ("reference");--> statement-breakpoint
CREATE INDEX "payout_circle_idx" ON "payouts" ("circle_id");--> statement-breakpoint
CREATE INDEX "payout_user_idx" ON "payouts" ("user_id");--> statement-breakpoint
CREATE INDEX "payout_ref_idx" ON "payouts" ("reference");--> statement-breakpoint
CREATE INDEX "va_circle_idx" ON "virtual_accounts" ("circle_id");--> statement-breakpoint
CREATE INDEX "va_bank_account_idx" ON "virtual_accounts" ("bank_account_number");--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_circle_id_circles_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_reconciled_by_users_id_fkey" FOREIGN KEY ("reconciled_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_circle_id_circles_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "virtual_accounts" ADD CONSTRAINT "virtual_accounts_circle_id_circles_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE;