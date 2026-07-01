CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) DEFAULT '' NOT NULL,
	"target_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"current_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"deadline" date,
	"create_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" date,
	"description" varchar(255),
	"source" varchar(50),
	"create_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"password" varchar(255) NOT NULL,
	"monthly_income" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"initial_balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"final_balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"create_at" timestamp,
	"last_reset_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;