ALTER TABLE "public"."invitations" ADD COLUMN "pt_plan_id" uuid REFERENCES "public"."plans"("id");
ALTER TABLE "public"."subscriptions" ADD COLUMN "pt_plan_id" uuid REFERENCES "public"."plans"("id");
