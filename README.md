# Philips Lawn

Lawn-mowing app prototype codebase (Expo + React Native + TypeScript).

## Run it

1. Install Node.js LTS if you don't have it.
2. In this folder: `npm install`
3. `npm start`, then scan the QR code with the Expo Go app on your phone.

Without Supabase keys the app opens in demo mode: pick homeowner or lawn pro and look around (nothing is saved). The Forecast tab runs the growth model on sample data. Change grass type, cut height and "healthy vs tidy" and the projected mow date updates.

To sign up and sign in for real, copy `.env.example` to `.env`, add your Supabase project URL and publishable key, apply the SQL in `supabase/migrations/`, and restart `npm start`.

## Keep building with Claude Code

Open this folder in Claude Code and start with:

> Read CLAUDE.md and docs/SPEC.md, then do phase 1.

The plan, model and data choices are in `docs/SPEC.md`.
