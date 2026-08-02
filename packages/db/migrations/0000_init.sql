CREATE TYPE "public"."asset_kind" AS ENUM('avatar', 'garment', 'tryon', 'catalogue');--> statement-breakpoint
CREATE TYPE "public"."entitlement_kind" AS ENUM('consumable', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."item_category" AS ENUM('top', 'bottom', 'dress', 'outerwear', 'footwear', 'bag', 'accessory', 'headwear', 'underwear', 'swimwear', 'other');--> statement-breakpoint
CREATE TYPE "public"."item_colour" AS ENUM('black', 'white', 'grey', 'beige', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'multi', 'other');--> statement-breakpoint
CREATE TYPE "public"."item_source" AS ENUM('user_photo', 'user_url', 'catalogue');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'pass', 'review', 'fail');--> statement-breakpoint
CREATE TYPE "public"."moderation_verdict" AS ENUM('pass', 'fail', 'review');--> statement-breakpoint
CREATE TYPE "public"."outfit_status" AS ENUM('draft', 'finalised');--> statement-breakpoint
CREATE TYPE "public"."tagging_status" AS ENUM('pending', 'tagged', 'failed', 'manual');--> statement-breakpoint
CREATE TYPE "public"."tryon_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"r2_key" text NOT NULL,
	"mime" text NOT NULL,
	"width" integer,
	"height" integer,
	"bytes" bigint,
	"sha256" char(64) NOT NULL,
	"kind" "asset_kind" NOT NULL,
	"moderation_status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" text NOT NULL,
	"kind" "entitlement_kind" NOT NULL,
	"slots_granted" integer,
	"expires_at" timestamp with time zone,
	"rc_event_id" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source" "item_source" NOT NULL,
	"owner_user_id" uuid,
	"brand" text,
	"external_id" text,
	"title" text NOT NULL,
	"price_minor" integer,
	"currency" char(3),
	"product_url" text,
	"affiliate_url" text,
	"primary_asset_id" uuid,
	"category" "item_category" DEFAULT 'other' NOT NULL,
	"subcategory" text,
	"colour_primary" "item_colour",
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"raw" jsonb,
	"fetched_at" timestamp with time zone,
	"tagging_status" "tagging_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "moderation_results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"asset_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"verdict" "moderation_verdict" NOT NULL,
	"scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"raw" jsonb,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfit_items" (
	"outfit_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "outfit_items_outfit_id_item_id_pk" PRIMARY KEY("outfit_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "outfits" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text,
	"status" "outfit_status" DEFAULT 'draft' NOT NULL,
	"cover_asset_id" uuid,
	"finalised_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "slots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"index" integer NOT NULL,
	"outfit_id" uuid,
	"filled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_map" (
	"source" text NOT NULL,
	"source_value" text NOT NULL,
	"our_category" "item_category" NOT NULL,
	"our_subcategory" text,
	"reviewed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taxonomy_map_source_source_value_pk" PRIMARY KEY("source","source_value")
);
--> statement-breakpoint
CREATE TABLE "tryon_renders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cache_key" char(64) NOT NULL,
	"user_id" uuid NOT NULL,
	"outfit_id" uuid NOT NULL,
	"avatar_asset_id" uuid NOT NULL,
	"result_asset_id" uuid,
	"model_version" text NOT NULL,
	"status" "tryon_status" DEFAULT 'pending' NOT NULL,
	"cost_minor" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"phone_hash" text NOT NULL,
	"handle" text NOT NULL,
	"avatar_asset_id" uuid,
	"avatar_consent_at" timestamp with time zone,
	"free_slots_total" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_primary_asset_id_assets_id_fk" FOREIGN KEY ("primary_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_results" ADD CONSTRAINT "moderation_results_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_cover_asset_id_assets_id_fk" FOREIGN KEY ("cover_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_renders" ADD CONSTRAINT "tryon_renders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_renders" ADD CONSTRAINT "tryon_renders_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_renders" ADD CONSTRAINT "tryon_renders_avatar_asset_id_assets_id_fk" FOREIGN KEY ("avatar_asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_renders" ADD CONSTRAINT "tryon_renders_result_asset_id_assets_id_fk" FOREIGN KEY ("result_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assets_r2_key_key" ON "assets" USING btree ("r2_key");--> statement-breakpoint
CREATE INDEX "assets_user_sha_idx" ON "assets" USING btree ("user_id","sha256");--> statement-breakpoint
CREATE INDEX "assets_moderation_status_idx" ON "assets" USING btree ("moderation_status");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlements_rc_event_id_key" ON "entitlements" USING btree ("rc_event_id");--> statement-breakpoint
CREATE INDEX "entitlements_user_idx" ON "entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "items_source_brand_external_key" ON "items" USING btree ("source","brand","external_id") WHERE "items"."external_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "items_owner_idx" ON "items" USING btree ("owner_user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "items_category_idx" ON "items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "items_colour_idx" ON "items" USING btree ("colour_primary");--> statement-breakpoint
CREATE INDEX "moderation_results_asset_idx" ON "moderation_results" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "outfit_items_position_key" ON "outfit_items" USING btree ("outfit_id","position");--> statement-breakpoint
CREATE INDEX "outfits_user_idx" ON "outfits" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "slots_user_index_key" ON "slots" USING btree ("user_id","index");--> statement-breakpoint
CREATE UNIQUE INDEX "slots_outfit_key" ON "slots" USING btree ("outfit_id") WHERE "slots"."outfit_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tryon_renders_cache_key_key" ON "tryon_renders" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "tryon_renders_user_idx" ON "tryon_renders" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_hash_key" ON "users" USING btree ("phone_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_handle_key" ON "users" USING btree ("handle");