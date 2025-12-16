---
description: Verify Trainer Integration (Login -> Onboarding -> Dashboard)
---

# Verify Trainer Integration

This workflow guides you through testing the newly implemented Trainer Authentication and Onboarding flow.

## Prerequisites
- [ ] Ensure Supabase Database is running.
- [ ] Ensure Migration `20240101000005_add_trainer_fields.sql` has been applied.

## Steps

### 1. Trainer Login
1. Open the App.
2. Navigate to **Trainer** tab/section (or if you have a role selector).
3. Tap **"Trainer Login"**.
4. Enter a Phone Number (e.g., `+1 999 999 9999` for testing).
5. Tap **"Send OTP"**.
   - [ ] Verify `recaptcha` verification occurs (if configured) or skipped in dev.
   - [ ] Verify Alert: "OTP sent!".
6. Enter OTP (e.g., `123456` if using a test number).
7. Tap **"Verify OTP"**.
   - [ ] Verify Console Log: "Trainer Phone Auth Success".
   - [ ] Verify Navigation: Redirects to **TrainerOnboarding** screen.

### 2. Trainer Onboarding
1. On the **Trainer Onboarding** screen:
   - [ ] Verify phone number is pre-filled/readonly.
2. Enter **Full Name** (e.g., "John Trainer").
3. Enter **Email** (e.g., "john@trainer.com").
4. Select **Primary Specialization** (e.g., "Weight Loss").
5. (Optional) Fill in other fields like Age, Bio, etc.
6. Tap **"Save Profile"**.
   - [ ] Verify Loading Indicator appears.
   - [ ] Verify Navigation: Redirects to **TrainerDashboard**.

### 3. Trainer Dashboard
1. On the **Trainer Dashboard**:
   - [ ] **Check Header**: Verify it says "Welcome back, John Trainer!" (matching the name you entered).
   - [ ] **Check Content**: Verify the dashboard loads without crashing.

## Troubleshooting
- If Login fails, check Firebase Console -> Authentication -> Sign-in method -> Phone.
- If Onboarding fails, check Supabase Logs for `profiles` table RLS policies or schema mismatches.
