# Philips Lawn (working name)

Phone app: size a lawn from address + photos, project when it needs mowing from grass type, cut height, weather, rain and shade, and book a local pro for that day. Pros get a schedule/customer dashboard and an open-jobs feed.

Read these first:
- `docs/SPEC.md`: features, growth model, data sources, data model, build phases, open decisions.
- `AGENTS.md`: Expo conventions (Expo Router in `src/app/`, `npx expo install`, check versioned Expo docs instead of trusting memory).
- Clickable prototype for look and flow: https://claude.ai/artifact/5HjExiVoXGXKgNnpH2BC9p

## Where things are

- `App.tsx`: starter screen. Live growth projection on sample data, with grass type, cut height and mow-at ratio controls. Replace with Expo Router in phase 1.
- `src/lib/growth.ts`: the growth model. Pure TypeScript, no React or network. Keep it that way so it can run in the app and in a backend function.
- `src/lib/growth.test.ts`: model tests (vitest).
- `src/lib/sampleData.ts`: sample zones/weather matching the prototype (fictional address; last cut Sep 30, 2026; projects Fri Oct 9).

## Commands

```
npm install
npm start            # Expo dev server; scan the QR code with Expo Go
npm test             # model tests
npm run typecheck
npx expo lint
```

## Working rules

- Run `npm test` and `npm run typecheck` before calling anything done.
- If you change model coefficients or curves, update the tests and note why in the commit. The "fescue at 3.5 in → Oct 9" test is the anchor that ties the model to the prototype. Change it on purpose, not by accident.
- Units are inches, °F, sq ft (US pilot). Convert at the edges if metric is ever added.
- Weather beyond ~7 days is a trend, not a forecast. Label it that way in the UI.
- Photos and user corrections to grass type/shade are training data. Store them with the correction, not just the final value.
- Never hardcode API keys. Use Expo public env vars only for publishable keys; secrets live in Supabase Edge Function env.
- Developed on Windows: use npm scripts, avoid bash-only commands in package.json.
