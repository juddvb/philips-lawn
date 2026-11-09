# Philips Lawn (working name)

Phone app for US homeowners (pilot: Roanoke Valley) and local lawn pros: a homeowner sizes a lawn from address + map outline, the app projects when it needs mowing from grass type, cut height, weather, rain and shade, and books a local pro for that day. Pros get a schedule/customer dashboard and an open-jobs feed. Currently phases 1-2 of `docs/SPEC.md` are built (shell, auth, property + measuring, growth model); photos, live weather, bookings and the pro dashboard are not.

Read first: `docs/SPEC.md` (features, data model, phases, open decisions) and `docs/working.md` (what ships, secrets, known gaps). Prototype for look and flow: https://claude.ai/artifact/5HjExiVoXGXKgNnpH2BC9p

## Stack and run locally

Expo SDK 57 / React Native 0.86 / React 19, TypeScript, Expo Router (`src/app/`), Supabase (auth + Postgres), vitest, ESLint (`eslint-config-expo`). Node 24.

```
npm ci               # install (use npm install only when changing dependencies)
npm start            # Expo dev server; Expo Go via QR code, or press w for web
npx expo install <pkg>   # ALWAYS use instead of npm add; resolves SDK-compatible versions
npx expo-doctor      # diagnose dependency and config issues
```

No env vars are needed to run: with them blank the app is in local demo mode (pick homeowner or pro, nothing saved to a server). For real sign-in, copy `.env.example` to `.env` and fill the two names below, then apply `supabase/migrations/` (`supabase db push` or the SQL editor).

## The check (run before calling anything done)

```
npm test && npm run typecheck && npm run lint
```
(vitest run, `tsc --noEmit`, `expo lint`.) Needs no secrets; the same command runs in `.github/workflows/check.yml`.

## Ship target

Nothing ships yet. No `eas.json`, no store config, no deploy workflow, no EAS project id; `app.json` has no bundle id or package name. Do not add a deploy or an EAS build/submit/update step without the owner asking. Default branch is `main`.

## Secrets (names only)

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: in a local, git-ignored `.env`. These are bundled into the app, so only the publishable (anon) key goes here.
- Supabase service_role/secret key and any other server secret: Supabase Edge Function env only, never in the repo or an `EXPO_PUBLIC_` variable.
- A Google Maps key for production builds is not wired yet; it would go through the maps config plugin from an EAS/secret store.

## Where things are

- `src/app/`: routes. `_layout.tsx` loads fonts and gates on auth with `Stack.Protected`; `sign-in.tsx`, `sign-up.tsx`; `(app)/(tabs)/` has Lawn (`index`), Forecast, Book, Pro (only for `role = 'pro'`); `(app)/account.tsx`; `(app)/property/` is the add-property flow (`address.tsx` US Census geocoder, no key, blocked by CORS on web so use "Use the sample address"; `outline.tsx` zone editor).
- Keep non-route code (components, hooks, utils) outside `src/app/`. `src/theme.ts` design tokens; `src/components/` shared UI. `LawnMap.tsx` is `react-native-maps` (Expo Go works without a key); `LawnMap.web.tsx` is a grid-only web stand-in.
- `src/lib/growth.ts` growth model, `lawnGeometry.ts`, `mowTime.ts`: pure TypeScript, no React or network, so they can also run in a backend function. Tests: `growth.test.ts`, `measure.test.ts`.
- `src/lib/supabase.ts`, `auth.tsx` (`useAuth()`), `property.tsx` (`useProperty()`, Supabase `save_property` RPC or device storage in demo mode), `sampleData.ts`.
- `supabase/migrations/`: schema. `profiles` row comes from a trigger on sign-up metadata; users cannot change their own role. Polygons are stored as JSON.

## Rules that must never break

- No secret in the repo, ever (this repository is PUBLIC). Never commit `.env`, keys, tokens, service_role keys, `*.jks`, `*.p8`, `*.pem`.
- Never put a secret in an `EXPO_PUBLIC_` variable.
- Units are inches, °F, sq ft (US pilot); convert at the edges only.
- Model changes: if you change coefficients or curves, update the tests and say why in the commit. The "fescue at 3.5 in -> Oct 9" test and the "8,400 sq ft -> push 46 / rider 21 / zero-turn 13 min" test anchor the model to the prototype; change them on purpose, not by accident.
- Weather beyond ~7 days is a trend, not a forecast; label it so in the UI.
- Photos and user corrections to grass type/shade are training data: store the correction, not just the final value.
- Users cannot change their own role (keep the trigger and policies).
- If `ios/` and `android/` do not exist they are generated (Continuous Native Generation). Never create or edit them by hand; configure native behavior in `app.json` and config plugins.
- Developed on Windows too: use npm scripts, no bash-only commands in `package.json`.

## Expo changes fast: do not trust memory

Before writing code that touches an Expo, EAS or React Native API: read the major version of `expo` in `package.json`, fetch `https://docs.expo.dev/versions/v<major>.0.0/`, and for anything else `https://docs.expo.dev/llms.txt`. Prefer Expo modules over third-party libraries. Expo Go only has its bundled native modules; a library with native code needs a development build (`npx expo run:ios|android`, or `eas build --profile development`).

## Working alongside other agents

- Stay inside the files your task names. For a shared file (layout, theme, migrations, `package.json`), make the smallest additive edit and re-read it right before editing.
- Use only the port your task gives you (Expo dev server default 8081); kill every server or browser you started before you finish.
- One branch per session (`claude/<topic>`). Never push to `main`. Do not open a pull request unless asked.
- Stage files by name (`git add <path>`), never `git add -A`. Commit messages carry no model names.
- Do not create planning or summary documents beyond what the task names.
