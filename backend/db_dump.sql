


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."branch_role_enum" AS ENUM (
    'owner',
    'branch_admin',
    'reception',
    'trainer',
    'member'
);


ALTER TYPE "public"."branch_role_enum" OWNER TO "postgres";


CREATE TYPE "public"."branch_user_status_enum" AS ENUM (
    'active',
    'pending',
    'suspended'
);


ALTER TYPE "public"."branch_user_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."client_status_enum" AS ENUM (
    'active',
    'pending',
    'archived'
);


ALTER TYPE "public"."client_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."fitness_level_enum" AS ENUM (
    'Beginner',
    'Intermediate',
    'Advanced'
);


ALTER TYPE "public"."fitness_level_enum" OWNER TO "postgres";


CREATE TYPE "public"."gender_enum" AS ENUM (
    'Male',
    'Female',
    'Other'
);


ALTER TYPE "public"."gender_enum" OWNER TO "postgres";


CREATE TYPE "public"."plan_type_enum" AS ENUM (
    'Free',
    'AI',
    'AI Premium'
);


ALTER TYPE "public"."plan_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."session_status_enum" AS ENUM (
    'started',
    'completed',
    'abandoned'
);


ALTER TYPE "public"."session_status_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_is_branch_admin"("lookup_branch_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.branch_users
    WHERE branch_id = lookup_branch_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'branch_admin')
  );
END;
$$;


ALTER FUNCTION "public"."check_is_branch_admin"("lookup_branch_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.app_users (id, email, phone)
    VALUES (NEW.id, NEW.email, NEW.phone);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_users" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_seen" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branch_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "branch_id" "uuid",
    "user_id" "uuid",
    "role" "public"."branch_role_enum" DEFAULT 'member'::"public"."branch_role_enum" NOT NULL,
    "status" "public"."branch_user_status_enum" DEFAULT 'pending'::"public"."branch_user_status_enum",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "permissions" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."branch_users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."branch_users"."permissions" IS 'Array of permissions granted to the user for this branch.';



CREATE TABLE IF NOT EXISTS "public"."branches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "name" "text" NOT NULL,
    "city" "text",
    "state" "text",
    "country" "text",
    "address" "text",
    "gym_code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contact_email" "text",
    "contact_phone" "text",
    "zip_code" "text",
    "timezone" "text" DEFAULT 'UTC'::"text"
);


ALTER TABLE "public"."branches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "slug" "text",
    "body" "text",
    "status" "text" DEFAULT 'Draft'::"text",
    "author_id" "uuid",
    "meta_title" "text",
    "meta_description" "text",
    "thumbnail_url" "text",
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "gym_code" "text"
);


ALTER TABLE "public"."content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diet_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "date" "date" NOT NULL,
    "daily_calories" integer DEFAULT 0,
    "water_intake" integer DEFAULT 0,
    "meals" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."diet_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gym_code" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "name" "text",
    "phone" "text",
    "email" "text",
    "token" "text" DEFAULT ("gen_random_uuid"())::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "plan_id" "uuid",
    "address" "text",
    "pt_plan_id" "uuid",
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "assigned_trainer_id" "uuid"
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."invitations"."permissions" IS 'Array of permissions to be granted when the user accepts the invitation.';



CREATE TABLE IF NOT EXISTS "public"."lead_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid",
    "note" "text" NOT NULL,
    "type" "text" DEFAULT 'Note'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "gym_code" "text"
);


ALTER TABLE "public"."lead_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "source" "text",
    "status" "text" DEFAULT 'New'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "gym_code" "text",
    "assigned_trainer_id" "uuid",
    "address" "text",
    "lost_reason" "text"
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."measurement_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "weight" numeric,
    "body_fat_percentage" numeric,
    "muscle_mass_percentage" numeric,
    "water_percentage" numeric,
    "bone_mass" numeric,
    "visceral_fat" numeric,
    "bmr" numeric,
    "metabolic_age" integer,
    "waist" numeric,
    "hip" numeric,
    "chest" numeric,
    "arms" numeric,
    "thighs" numeric,
    "neck" numeric,
    "shoulders" numeric,
    "calves" numeric,
    "notes" "text",
    "photos" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."measurement_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "bucket_id" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "type" "text",
    "size_bytes" bigint,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owners" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "business_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "stripe_payment_intent_id" "text",
    "amount" integer,
    "currency" "text",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "currency" "text" DEFAULT 'INR'::"text",
    "interval" "text" DEFAULT 'Monthly'::"text",
    "features" "text"[],
    "is_active" boolean DEFAULT true,
    "stripe_price_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "gym_code" "text",
    "type" "text" DEFAULT 'Membership'::"text"
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "name" "text",
    "avatar_url" "text",
    "age" integer,
    "gender" "public"."gender_enum",
    "height" "text",
    "weight" "text",
    "fitness_level" "public"."fitness_level_enum",
    "experience_duration" "text",
    "goal" "text",
    "body_measurements" "jsonb" DEFAULT '{}'::"jsonb",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "plan_type" "public"."plan_type_enum" DEFAULT 'Free'::"public"."plan_type_enum",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "activity_level" "text",
    "workout_days" "text",
    "injuries" "text",
    "medical_conditions" "text",
    "workout_location" "text",
    "training_style" "text",
    "exercises_to_avoid" "text",
    "waist" "text",
    "hip" "text",
    "chest" "text",
    "arms" "text",
    "thighs" "text",
    "full_name" "text",
    "phone_number" "text",
    "years_of_experience" "text",
    "primary_specialization" "text",
    "secondary_skills" "text"[],
    "certification_type" "text",
    "certification_notes" "text",
    "coaching_method" "text",
    "client_type" "text",
    "max_clients" "text",
    "bio" "text",
    "role" "text" DEFAULT 'member'::"text",
    "email" "text",
    "gym_code" "text",
    "organization_name" "text",
    "branch_name" "text",
    "gym_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "address" "text",
    "gym_street" "text",
    "gym_city" "text",
    "gym_country" "text",
    "gym_pincode" "text",
    "gym_state" "text",
    "gym_branch_name" "text",
    "members_count" "text",
    "assigned_trainer_id" "uuid"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "workout_id" "uuid",
    "status" "public"."session_status_enum" DEFAULT 'started'::"public"."session_status_enum",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "logs" "jsonb" DEFAULT '{}'::"jsonb",
    "metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "status" "text",
    "current_period_end" timestamp with time zone,
    "plan_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "pt_plan_id" "uuid"
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainer_clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid",
    "client_id" "uuid",
    "status" "public"."client_status_enum" DEFAULT 'active'::"public"."client_status_enum",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trainer_clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text" NOT NULL,
    "role" "text" DEFAULT 'owner'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid",
    "client_id" "uuid",
    "workout_id" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "due_date" timestamp with time zone,
    "status" "text" DEFAULT 'assigned'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workout_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "workout_assignment_id" "uuid",
    "exercise_id" integer NOT NULL,
    "exercise_name" "text" NOT NULL,
    "set_number" integer NOT NULL,
    "weight" "text",
    "reps" "text",
    "notes" "text",
    "logged_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workout_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "difficulty" "public"."fitness_level_enum",
    "duration" "text",
    "calories" "text",
    "exercises" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workouts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branch_users"
    ADD CONSTRAINT "branch_users_branch_id_user_id_key" UNIQUE ("branch_id", "user_id");



ALTER TABLE ONLY "public"."branch_users"
    ADD CONSTRAINT "branch_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_gym_code_key" UNIQUE ("gym_code");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."diet_logs"
    ADD CONSTRAINT "diet_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diet_logs"
    ADD CONSTRAINT "diet_logs_user_id_date_key" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."lead_logs"
    ADD CONSTRAINT "lead_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."measurement_logs"
    ADD CONSTRAINT "measurement_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_clients"
    ADD CONSTRAINT "trainer_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_clients"
    ADD CONSTRAINT "trainer_clients_trainer_id_client_id_key" UNIQUE ("trainer_id", "client_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_assignments"
    ADD CONSTRAINT "workout_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_pkey" PRIMARY KEY ("id");



CREATE INDEX "messages_receiver_sender_idx" ON "public"."messages" USING "btree" ("receiver_id", "sender_id");



CREATE INDEX "messages_sender_receiver_idx" ON "public"."messages" USING "btree" ("sender_id", "receiver_id");



CREATE OR REPLACE TRIGGER "handle_branch_users_updated_at" BEFORE UPDATE ON "public"."branch_users" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_branches_updated_at" BEFORE UPDATE ON "public"."branches" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_owners_updated_at" BEFORE UPDATE ON "public"."owners" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."diet_logs" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."measurement_logs" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."trainer_clients" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."workout_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."workouts" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."branch_users"
    ADD CONSTRAINT "branch_users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."branch_users"
    ADD CONSTRAINT "branch_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diet_logs"
    ADD CONSTRAINT "diet_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pt_plan_id_fkey" FOREIGN KEY ("pt_plan_id") REFERENCES "public"."plans"("id");



ALTER TABLE ONLY "public"."lead_logs"
    ADD CONSTRAINT "lead_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lead_logs"
    ADD CONSTRAINT "lead_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_trainer_id_fkey" FOREIGN KEY ("assigned_trainer_id") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."measurement_logs"
    ADD CONSTRAINT "measurement_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pt_plan_id_fkey" FOREIGN KEY ("pt_plan_id") REFERENCES "public"."plans"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_clients"
    ADD CONSTRAINT "trainer_clients_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_clients"
    ADD CONSTRAINT "trainer_clients_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_assignments"
    ADD CONSTRAINT "workout_assignments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_assignments"
    ADD CONSTRAINT "workout_assignments_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_assignments"
    ADD CONSTRAINT "workout_assignments_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_workout_assignment_id_fkey" FOREIGN KEY ("workout_assignment_id") REFERENCES "public"."workout_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage content" ON "public"."content" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can manage invitations" ON "public"."invitations" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can manage lead logs" ON "public"."lead_logs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can manage leads" ON "public"."leads" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can manage plans" ON "public"."plans" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Branch Admins can view branch users" ON "public"."branch_users" FOR SELECT USING ("public"."check_is_branch_admin"("branch_id"));



CREATE POLICY "Clients can update assignments" ON "public"."workout_assignments" FOR UPDATE USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can view assigned private workouts" ON "public"."workouts" FOR SELECT USING (("id" IN ( SELECT "workout_assignments"."workout_id"
   FROM "public"."workout_assignments"
  WHERE ("workout_assignments"."client_id" = "auth"."uid"()))));



CREATE POLICY "Clients can view assignments" ON "public"."workout_assignments" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can view their trainer" ON "public"."trainer_clients" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Owners can update their own record" ON "public"."owners" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Owners can view branch users" ON "public"."branch_users" FOR SELECT USING (("branch_id" IN ( SELECT "branches"."id"
   FROM "public"."branches"
  WHERE ("branches"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Owners can view their own record" ON "public"."owners" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Owners can view/manage their branches" ON "public"."branches" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Public can view active plans" ON "public"."plans" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view published content" ON "public"."content" FOR SELECT USING (("status" = 'Published'::"text"));



CREATE POLICY "Service role full access" ON "public"."users" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Trainers can add clients" ON "public"."trainer_clients" FOR INSERT WITH CHECK (("trainer_id" = "auth"."uid"()));



CREATE POLICY "Trainers can manage assignments" ON "public"."workout_assignments" USING (("trainer_id" = "auth"."uid"()));



CREATE POLICY "Trainers can update their clients" ON "public"."trainer_clients" FOR UPDATE USING (("trainer_id" = "auth"."uid"()));



CREATE POLICY "Trainers can view client diet logs" ON "public"."diet_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trainer_clients" "tc"
  WHERE (("tc"."client_id" = "diet_logs"."user_id") AND ("tc"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainers can view client logs" ON "public"."workout_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trainer_clients" "tc"
  WHERE (("tc"."client_id" = "workout_logs"."user_id") AND ("tc"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainers can view client measurements" ON "public"."measurement_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trainer_clients" "tc"
  WHERE (("tc"."client_id" = "measurement_logs"."user_id") AND ("tc"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainers can view client sessions" ON "public"."sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trainer_clients" "tc"
  WHERE (("tc"."client_id" = "sessions"."user_id") AND ("tc"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Trainers can view their clients" ON "public"."trainer_clients" FOR SELECT USING (("trainer_id" = "auth"."uid"()));



CREATE POLICY "Users can assign to themselves" ON "public"."workout_assignments" FOR INSERT WITH CHECK ((("client_id" = "auth"."uid"()) AND ("trainer_id" = "auth"."uid"())));



CREATE POLICY "Users can create own sessions" ON "public"."sessions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create own workouts" ON "public"."workouts" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own diet logs" ON "public"."diet_logs" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own logs" ON "public"."workout_logs" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own measurements" ON "public"."measurement_logs" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own media" ON "public"."media" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own workouts" ON "public"."workouts" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own diet logs" ON "public"."diet_logs" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own logs" ON "public"."workout_logs" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own measurements" ON "public"."measurement_logs" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own media" ON "public"."media" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own record" ON "public"."app_users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can read own data" ON "public"."users" FOR SELECT USING (("phone" = ("auth"."jwt"() ->> 'phone'::"text")));



CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can update own diet logs" ON "public"."diet_logs" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own logs" ON "public"."workout_logs" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own measurements" ON "public"."measurement_logs" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own record" ON "public"."app_users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own sessions" ON "public"."sessions" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own workouts" ON "public"."workouts" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view messages they sent or received" ON "public"."messages" FOR SELECT USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "receiver_id")));



CREATE POLICY "Users can view own assignments" ON "public"."workout_assignments" FOR SELECT USING ((("client_id" = "auth"."uid"()) OR ("trainer_id" = "auth"."uid"())));



CREATE POLICY "Users can view own diet logs" ON "public"."diet_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own logs" ON "public"."workout_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own measurements" ON "public"."measurement_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own media" ON "public"."media" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own payments" ON "public"."payments" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own sessions" ON "public"."sessions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own subscription" ON "public"."subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own workouts" ON "public"."workouts" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view public workouts" ON "public"."workouts" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Users can view self" ON "public"."branch_users" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own identity" ON "public"."app_users" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."app_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branch_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."diet_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."measurement_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."owners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trainer_clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workouts" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO "service_role";







































































































































































































