ALTER TABLE "public"."invitations" ADD COLUMN IF NOT EXISTS "pt_plan_id" uuid REFERENCES "public"."plans"("id");
ALTER TABLE "public"."subscriptions" ADD COLUMN IF NOT EXISTS "pt_plan_id" uuid REFERENCES "public"."plans"("id");
