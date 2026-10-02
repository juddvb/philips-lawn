# Philips Lawn — product spec

Working name. A phone app that sizes up a lawn from the address and a few photos, predicts when it will need mowing based on grass type, cut height, weather, rain and shade, and lets the homeowner book a local pro on that day. Landscapers get a dashboard of their jobs and customers.

Clickable prototype (10 screens): https://claude.ai/artifact/5HjExiVoXGXKgNnpH2BC9p — private until shared from its Share menu.

## Who it's for

- **Homeowners** who want the lawn cut when it needs it, at the height they like, without managing it.
- **Landscapers / mowing pros** who want a steady, nearby route and fewer wasted trips to lawns that didn't need cutting.

## What the homeowner can do

1. **Add a property.** Enter an address. The app pulls satellite imagery and the parcel boundary, suggests a lawn outline (house, driveway, beds and tree canopy subtracted), and lets them adjust corners or trace it themselves. Output: mowable sq ft, split into zones.
2. **Photo walk.** 4 guided photos (front, back, sides, gates/tricky spots), plus a blade close-up. From the photos the app:
   - **Identifies grass type** with a confidence score and a runner-up ("Tall fescue, 87% · next: Kentucky bluegrass 9%"). User can override.
   - **Estimates shade per zone** (sun hours/day) from tree canopy in the photos and imagery plus the sun's path at that latitude and date.
   - Flags slope, obstacles, edges to trim, and gate width (matters for which mowers fit).
3. **See mow time** by mower type (push / rider / zero-turn), including trim and cleanup.
4. **Set cut height.** The app recommends a height for the grass type and season and warns outside the healthy range. The homeowner picks:
   - **Cut to** height (e.g. 3.5 in).
   - **Mow when it reaches**: "Healthy" (remove ⅓ of the blade, 1.5× cut height) or "Tidy" (remove ¼, 1.33×).
5. **Growth projection.** A day-by-day projected height chart with the mow-at line, the projected mow date, and why ("1.0 in of rain Sun–Mon", "highs near ideal for fescue", "shaded back corner grows ~3 days slower"). Updates as forecasts change. Beyond ~7 days it's shown as a seasonal trend, not a forecast.
6. **Choose services.** Mowing, aeration & overseeding, leaf cleanup, fertilize & weed control, dethatching. Seasonal tags ("Best now" for fescue aeration in fall). Aeration picks a date the day after a mow and before rain, and recommends seed per zone (shade-tolerant mix for shaded zones).
7. **Frequency for mowing**: once, per forecast (each date comes from the projection, confirmed 3 days ahead), or fixed weekly.
8. **Get bids and pick a pro.** Bids show price per service, rating, distance, equipment, and whether they can come on the projected date. Sort by best match / price / rating.
9. **Pro profiles**: business, badges (insured, background-checked), service area, equipment, work photos, rating breakdown (quality, on time, communication), reviews.
10. **Booking**: pro mows → sends an after-mow photo (which also resets the height estimate) → homeowner approves (auto after 24 hrs) → payment releases → review. Reviews only from paid, completed jobs.

## What the landscaper can do

- **Dashboard / schedule**: upcoming jobs grouped by day, auto-scheduled from each customer's projection, with flags when weather moved a date ("moved up 1 day: faster growth after rain").
- **Customers**: list of every customer with lawn size, grass type, cut height, plan, and next projected date. Search.
- **Open jobs**: nearby requests filtered by service area and equipment fit (e.g. hide jobs where their deck won't fit the gate), pre-sized with area, terrain and estimated time on their equipment. Bid per service.
- **Profile**: business info, service area, equipment (deck width), services offered, insurance.

## Growth model (v1)

Implemented in `src/lib/growth.ts`, tested in `src/lib/growth.test.ts`. Heuristic, meant to be calibrated with real data.

Per zone, per day, starting at the cut height on the day after the last cut:

```
growth = baseRate(grass)
       × temperatureFactor(dailyHigh, grassOptimum)   // 0.15–1, peaks at optimum (cool-season ~66–68°F, warm-season ~84–86°F)
       × moistureFactor(rain over previous 3 days)    // 0.75–1.25, saturates at 0.75 in
       × sunFactor(sunHours × zoneSunFraction)        // 0.55–1, full at 7 hrs
height += growth
```

- **Mow-at height** = cut height × ratio (1.5 healthy, 1.33 tidy).
- **Lawn is due** on the first day the zones that have reached mow-at height cover ≥ 50% of the lawn area (configurable). Slower shady zones get cut along with the rest.
- **Cut height drives the result twice**: it's the starting height and it sets the mow-at threshold. Lower cut means more frequent mows. Out-of-range heights get a warning.
- Grass table (starting values): tall fescue 3–4 in (rec 3.5), Kentucky bluegrass 2.5–3.5 (rec 3), bermuda 1–2 (rec 1.5), zoysia 1.5–2.5 (rec 2). Seasonal recommendations (e.g. raise cool-season grass in summer heat) are a v2 refinement.

**Calibration plan:** every visit produces a before or after photo. Ask homeowners and pros to include a simple height reference (a printed gauge card or a phone-measured blade). Log predicted vs. observed height, then tune `baseGrowthInPerDay` and the factor curves per grass type and region. Track "projected date vs. date the pro said it actually needed cutting" as the headline accuracy metric.

## Data sources and services

Check pricing and terms before committing. Several of these change often.

| Need | Starting option | Notes |
|---|---|---|
| Geocoding + satellite imagery | Google Maps Platform (Geocoding, Map Tiles / Static Maps) or Mapbox | Imagery licensing limits what you can store. |
| Parcel boundaries | County GIS (Roanoke County, Salem and Roanoke City publish parcel data) for the pilot; Regrid for national coverage | |
| Lawn outline + area | User-adjusted polygon to start; area with `@turf/area` | Auto-segmentation from imagery is a later ML task. |
| Grass ID + shade from photos | Vision model call from a backend function (e.g. Claude API with image input) returning JSON: type, confidence, runner-up, shade cues, obstacles | Save photos + user corrections as labeled training data. |
| Sun path | `suncalc` (JS) for sun position by lat/lng/date | Combine with canopy/obstruction estimates per zone. Google's Solar API data layers may help with shade; worth evaluating. |
| Weather | Open-Meteo daily `temperature_2m_max`, `precipitation_sum`, `sunshine_duration`, plus past days for recent rain | Free tier is non-commercial. Plan for their paid API or NOAA/NWS (free, US-only) in production. Cache by grid cell, not per user. |
| Backend, auth, database, storage | Supabase (Postgres + PostGIS, Auth, Storage, Edge Functions, scheduled jobs) | |
| Payments to pros | Stripe Connect (Express accounts), charge per visit, release after approval | |
| Push notifications | Expo Notifications | "Mow date moved", "bid received", "pro on the way". |

## Data model (first cut)

- `profiles` — user id, role (`homeowner` | `pro`), name, phone.
- `properties` — owner, address, lat/lng, parcel geometry, lawn polygon, area_sqft, gate_width_in, slope.
- `lawn_zones` — property, name, polygon, area_sqft, sun_fraction.
- `lawn_photos` — property, zone, storage path, taken_at, analysis JSON (grass guess, confidence, shade, obstacles), user_corrected fields.
- `lawn_settings` — property, grass_type, grass_confidence, cut_height_in, mow_at_ratio, last_cut_at.
- `projections` — property, computed_at, due_date, mow_at_height, daily heights JSON, weather snapshot id.
- `job_requests` — property, services[], mowing_frequency (`once` | `forecast` | `weekly`), preferred dates, notes, status.
- `bids` — job_request, pro, line items (service, price), proposed date, note, status.
- `bookings` — job_request, accepted bid, pro, homeowner, status.
- `visits` — booking, service, scheduled_date, original_date (to show weather moves), status, before/after photo, approved_at, payout status.
- `pro_profiles` — user, business_name, service_area (PostGIS polygon or center+radius), equipment (deck widths), services offered, insurance verified, background checked.
- `reviews` — visit, homeowner, pro, ratings (quality, on_time, communication), text. One per paid visit.
- `messages` — booking thread.

## Build phases

1. **Shell.** Expo Router with tabs (Lawn, Forecast, Book, Pro), Supabase auth, role choice at sign-up, design tokens copied from the prototype (colors and type in `App.tsx` styles). Move the starter screen into `src/app/`.
2. **Property + measuring.** Address search → satellite map → editable polygon → zones → area and mow-time estimate.
3. **Photos, grass ID, shade.** Camera flow, upload to Storage, analysis function, confirm/override screen, sun-hours per zone.
4. **Live projection.** Weather function + nightly recompute for every property; push when the due date changes; after-mow photo resets `last_cut_at`.
5. **Services + marketplace.** Service picker, job requests, bids, pro profiles, reviews, booking on the projected date, Stripe Connect.
6. **Pro dashboard.** Schedule built from customers' projections, customer list, open-jobs feed filtered by area and equipment fit.
7. **Pilot.** Roanoke Valley: recruit a handful of pros first, then homeowners in their routes. Measure projection accuracy and repeat bookings.

## Open decisions

- Name and brand.
- Business model: commission per visit vs. pro subscription vs. homeowner fee.
- Bids only, or also instant-book at a pro's posted price?
- How firm is a "forecast" booking? What happens when rain pushes a mow past a pro's available day?
- Pro vetting: insurance verification, background checks, who pays for them.
- Liability and damage claims process.
- Handling warm-season dormancy and winter (pause plans automatically?).

## Competitors to study

GreenPal and LawnStarter (bidding/booking marketplaces). The differentiator here is the projection: mowing when the grass needs it at the height the owner chose, which keeps customers coming back and gives pros a smarter route.
