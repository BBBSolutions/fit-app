# Fit-App Backend (Supabase Cloud)

This backend is ready to be deployed directly to your **Supabase Cloud Project**.

## 🚀 Cloud Deployment Instructions

Follow these steps to deploy the database schema and edge functions to your online Supabase account.

### 1. Prerequisites
- **Supabase Account**: Log in at [supabase.com](https://supabase.com).
- **Supabase Project**: Create a new project.
- **Supabase CLI**: Install it on your machine.
    - **Windows (PowerShell)**: `scoop install supabase` OR `npm install -g supabase`

### 2. Login
Authenticates your CLI with your online account.
```bash
supabase login
```

### 3. Link Project
Connect this folder to your online project.
- Get your **Reference ID** from your project settings (it looks like `abcdefghijklm`).
- Get your **Database Password** you set when creating the project.

```bash
# IMPORTANT: Run this from the 'backend' folder
cd "C:\Users\User\fitapp old\fitapp frontend\backend"

supabase link --project-ref <your-reference-id>
```
*Enter your database password when prompted.*

### 4. Deploy Database Schema
Push the tables (Users, Profiles, Workouts, etc.) to your live database.
```bash
supabase db push
```

### 5. Set Environment Variables
Your Edge Functions need your Firebase settings.
Get your **Firebase Web API Key** from Firebase Console -> Project Settings.

```bash
supabase secrets set FIREBASE_API_KEY=your_firebase_api_key
```

### 6. Deploy Edge Functions
Deploy the serverless functions (Auth, Profiles, etc.).
```bash
supabase functions deploy --no-verify-jwt
```
_Note: We use `--no-verify-jwt` because we handle Firebase token verification manually._

---

## 🛠 Usage & Verification

### Base URL
Your API is now available at:
`https://<your-project-ref>.supabase.co/functions/v1`

### Authentication
All requests (except webhooks) must include the header:
`Authorization: Bearer <Firebase_ID_Token>`

### Postman Testing
1. Import `postman_collection.json`.
2. Update the `BASE_URL` variable to your new cloud URL.
3. Get a real ID token from your Expo app logic and use it to test endpoints.

## 📂 Project Structure
- `supabase/migrations/`: SQL files defining your database tables.
- `supabase/functions/`: TypeScript code for your API endpoints.
