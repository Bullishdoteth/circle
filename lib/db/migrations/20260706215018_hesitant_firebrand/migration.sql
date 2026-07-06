ALTER TABLE "circle_members" ADD COLUMN "rotation_position" integer;--> statement-breakpoint
ALTER TABLE "circle_members" ADD COLUMN "payout_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "circles" ADD COLUMN "contribution_amount" numeric(12,2) DEFAULT '50000.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "circles" ADD COLUMN "payout_method" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "circles" ADD COLUMN "frequency" text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "circles" ADD COLUMN "current_round" integer DEFAULT 1 NOT NULL;