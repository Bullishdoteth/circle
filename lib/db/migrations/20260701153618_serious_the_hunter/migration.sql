CREATE TABLE "users" (
	"id" uuid PRIMARY KEY,
	"clerk_id" text NOT NULL UNIQUE,
	"first_name" text,
	"last_name" text,
	"user_name" text UNIQUE,
	"email" text NOT NULL UNIQUE,
	"image_url" text,
	"address" text,
	"phone_number" text,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
