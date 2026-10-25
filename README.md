# HBPlus Cross-Platform Google Login

A starter application built with Expo, React Native, React Native Web, Supabase Auth (Google OAuth), and a Supabase PostgreSQL profile table. The same React Native codebase runs on web, Android, and iOS.

## Features

- Google OAuth login
- Exact email-domain allowlist: `@hbplus.fit`
- Unauthorized accounts are signed out and shown an access-denied message
- Protected dashboard (only rendered when an approved session exists)
- Profile upsert to Supabase PostgreSQL
- Row Level Security (RLS) policies restrict profile access to the user's own approved account
- Logout, loading states, and error handling

## Requirements

- Node.js 20.19+ recommended (or a current supported LTS)
- npm
- VS Code
- A Supabase project
- A Google Cloud project for OAuth credentials
- For native device testing: Android Studio/Android emulator or Expo Go; iOS simulator requires macOS

## 1. Install dependencies

Open this folder in VS Code, open Terminal > New Terminal, and run:

```bash
npm install
```

If Expo reports dependency version mismatches, run `npx expo install --fix` and then `npm install`.

## 2. Create Supabase project

1. Go to https://supabase.com and create a project.
2. Open Project Settings > API (or Connect, depending on dashboard version).
3. Copy the Project URL and the `anon` / publishable client key. Never put a `service_role` key in a client app.
4. Copy `.env.example` to a new file named `.env` in the project root.
5. Fill the values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
```

Restart Expo whenever `.env` changes.

## 3. Configure Google OAuth in Supabase

1. In Google Cloud Console, create/select a project.
2. Configure the OAuth consent screen and add the required app details/test users if the app is still in testing mode.
3. Create an OAuth Client ID of type **Web application**.
4. In Supabase Dashboard > Authentication > Providers > Google, enable Google and paste the Google Client ID and Client Secret.
5. Supabase shows an OAuth callback URL. Add that exact URL under Google Cloud Console > APIs & Services > Credentials > your OAuth client > Authorized redirect URIs. Do not guess this callback URL.
6. In Supabase Dashboard > Authentication > URL Configuration, add your local web URL (usually `http://localhost:8081`) to the allowed Redirect URLs. Add your deployed Netlify URL later, for example `https://your-site.netlify.app`.
7. For native OAuth, add the deep-link redirect `hbplusauth://auth/callback` to the allowed Redirect URLs as well.

Google OAuth configuration changes over time; follow the callback and redirect URLs shown by your actual Supabase/Google dashboards.

## 4. Create the database table and secure it

1. Open Supabase Dashboard > SQL Editor.
2. Open `supabase/schema.sql` from this repository.
3. Paste the full SQL into the editor and click Run.

This creates the `profiles` table, enables Row Level Security, and adds policies that limit profile access to the signed-in user's own approved `@hbplus.fit` identity. Do not disable RLS.

## 5. Run on web

```bash
npx expo start --web
```

Open the local URL shown in the terminal. Usually it is `http://localhost:8081` or `http://localhost:19006` depending on Expo version/configuration. Make sure the exact local URL is in Supabase's allowed Redirect URLs.

Alternatively:

```bash
npx expo start
```

Then press `w` in the Expo terminal to open the web version.

## 6. Run on Android

- Install Android Studio and create/start an Android Virtual Device, or install Expo Go on a physical Android phone.
- Run `npx expo start`, then press `a` to launch the Android emulator, or scan the QR code with Expo Go.
- The app scheme is configured as `hbplusauth` in `app.json`.
- For native Google OAuth, the `hbplusauth://auth/callback` redirect must be allowed in Supabase. Test the flow on the target Expo Go/development build because deep-link behavior can vary by Expo version and device. If a native callback fails, inspect the returned callback URL and your Supabase redirect allowlist first.

## 7. Run on iOS

Run `npx expo start` and press `i` with an iOS simulator available. iOS simulator requires macOS. For physical-device testing, use Expo Go or a development build and configure the app's deep link as needed.

## 8. Test cases

1. `person@hbplus.fit`: should reach the dashboard after successful Google OAuth.
2. `person@gmail.com`: should be signed out and shown an access restriction message.
3. Open/reload the dashboard while logged out: the login screen should show.
4. Click Sign out: the dashboard should disappear.
5. With an approved account, check Supabase > Table Editor > `profiles` for the user's profile row.
6. Try reading another user's profile: RLS should prevent it.

Note: use real test accounts and make sure the Google OAuth consent screen permits them. A user cannot sign in if Google/Supabase OAuth setup is incomplete.

## 9. Deploy web build to Netlify

1. Confirm `.env` works locally.
2. Build the web app:

```bash
npx expo export --platform web
```

3. The generated static site is in `dist/`.
4. Push the project to GitHub.
5. In Netlify, import the repository and set:
   - Build command: `npx expo export --platform web`
   - Publish directory: `dist`
6. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in Netlify site environment variables, then trigger a fresh deploy.
7. Add the final Netlify URL to Supabase Authentication > URL Configuration > Redirect URLs. If you use a custom domain, add that URL too.

Expo public environment variables are included in the client bundle. Only the Supabase anon/publishable key belongs there; never expose a service-role key or Google Client Secret in this app.

## Project structure

```text
hbplus-auth-app/
├── App.js
├── app.json
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── src/
│   ├── components/
│   │   ├── GoogleButton.js
│   │   └── Notice.js
│   └── lib/
│       ├── auth.js
│       └── supabase.js
└── supabase/
    └── schema.sql
```

## Important security notes

- Client-side email checks improve the UX but must not be the only security boundary. The database RLS policies are included as an additional enforcement layer for profile data.
- This starter restricts access to the profile table; if you add other tables or APIs, protect them with equivalent server-side authorization/RLS.
- If this must be restricted to members of a managed Google Workspace organization, configure Google Workspace/admin controls as appropriate in addition to checking the email domain.
- Never commit `.env` to GitHub.
