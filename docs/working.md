# Working on Philips Lawn

## What ships where

Nothing ships yet. There is no `eas.json`, no store listing, no bundle id / package name in `app.json`, no deploy workflow. The app runs in Expo Go or the web build (`npm start`). `main` is the default branch; agents work on `claude/<topic>` branches and never push to `main`. Supabase (hosted project) holds auth and the schema from `supabase/migrations/`, applied by hand with `supabase db push` or the SQL editor; nothing applies them automatically.

## Secrets (names only)

- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: local `.env` (git-ignored; template `.env.example`). Public-by-design keys, bundled in the app. Blank means demo mode.
- Supabase service_role key and other server secrets: Supabase Edge Function env only.
- Google Maps key (production map builds): not set up yet.
- GitHub Actions needs no secrets.

## The one check

```
npm test && npm run typecheck && npm run lint
```
Runs in CI (`.github/workflows/check.yml`) on every push and pull request. Last local run: 17 tests pass, typecheck and lint clean.

## Dev commands

- `npm ci` install; `npm start` dev server (Expo Go QR, `w` for web); `npm run web`, `android`, `ios`.
- `npm test`, `npm run typecheck`, `npm run lint` individually.
- `npx expo install <pkg>` to add dependencies; `npx expo-doctor` to diagnose.
- Setup needs only npm registry access.

## Broken or unfinished (as the code shows)

- Built: shell, auth, role choice, property address + outline, growth model, mow-time estimate. Per `docs/SPEC.md` phases 3-7 are not started: photos and grass ID, weather function and nightly recompute, push, services and marketplace, pro dashboard, pilot. The Book and Pro tabs are placeholders for that work.
- Address lookup (US Census geocoder) is blocked by CORS in the web build; there is no autocomplete.
- The forecast screen and weather use sample data (`src/lib/sampleData.ts`), not live weather.
- Only two test files exist (growth, measure); no screen, auth or Supabase tests.
- `docs/SPEC.md` open decisions: name and brand, business model, bid vs instant-book, booking firmness when rain intervenes, pro vetting, liability, dormancy and winter handling.
- The spec lists Stripe Connect in phase 5; nothing for payments exists.
