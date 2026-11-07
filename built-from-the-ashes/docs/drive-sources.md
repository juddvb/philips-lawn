# Where the media came from (Google Drive pass, 2026-11-07)

Pulled through the Claude Google Drive connector into `public/media/` (not committed; the manifest
`public/media.json` is). Files over 10 MB, which includes every video, cannot come through that connector,
so the items under "Not pulled" need to be downloaded on your computer and ingested with
`npm run ingest -- <folder> --append --pool <pool>`.

## Pulled

| Drive folder | What it is | Pool | Files |
| --- | --- | --- | --- |
| My Drive › **Warehouse** (uploaded Apr 8 2025) | Security-camera frames from the night of the fire (04-04-2025, 22:37–22:44) and daytime frames of the old shop from earlier that day | `fire`, `shop`, `crew` | IMG_3648, 3677–3681, 3704–3708 (night); IMG_3687–3695 (day) |
| My Drive root (uploaded Jun 16–19 2025) | Phone photos of the fire: building front in flames, firefighters, night rubble | `fire`, `rubble` | IMG_6463 (**loading-dock hard cut**), IMG_3647, 3650, 3651, 6445 |
| My Drive root (Jun 2025) | Van interiors, electrical close-ups, crew in temporary space | `vans`, `build`, `crew` | IMG_3622, 3628, 3639, 5447, 5451, 5613, 5639, 5967, 0553, 2927, 2929, 1240, IMG_20250422_103148 |
| My Drive › **New folder** (May 16 2025) | Vans outside the old brick building, road-trip shots, interiors | `rvtv-old` (stand-in), `roadtrip`, `vans`, `early` | IMG_0997, 0999, 3460, 2110, 2157, 2846, 2219, 3644, 0342, 0783, 0789, 2222, 5966, 72496060433…, Vanphotos 2-14-24-7 |
| My Drive root (May 9 2025) | Sprinter in the shop, interior | `early`, `vans` | image0, image5 |
| Noke Van Photos › Bianchi › Photos (Oct 2026, JPG Agency) | Pro photoshoot of a finished Sprinter inside the new building | `rvtv-new` (building shots), `build` (close-ups), `vans` | DSC07510–07600 |
| My Drive › **logos** | Round badge (transparent) and large asset | `logo` | printful round@500x.png, Asset.png |

Skipped on purpose: `Lawyer/pics` (duplicates of the Warehouse frames), `downloads/` (core-values poster,
renders), the insurance-claim page scans (`origin_p*.png`, `claim_p*.png`, `rfd_foia_p*.png`), personal
photos (IMG_0977, 1700, 2019, 2020), the hand-drawn shop layout (PXL_20250414).

## Not pulled (over the connector's 10 MB limit, or not found on Drive)

| Need | Where to look | Pool to ingest into |
| --- | --- | --- |
| RVTV / news clips of the old building, the aftermath, the new building | Not on Drive under any searchable name. Download from RVTV / station site. | `rvtv-old`, `rvtv-aftermath`, `rvtv-new` |
| Daytime rubble photos | Not found. Likely on phones / Instagram (April 5–10 2025). | `rubble` |
| Community support (fundraiser, shirts, volunteers) | Not found on Drive. Check Instagram / Facebook exports, the May 9 newsletter. | `community` |
| New building exterior | Not found. | `rvtv-new` |
| June 2025 iPhone videos `IMG_5892–5918.MOV` (My Drive root, 16–275 MB) | Probably rebuild / new-shop footage. | check, then `rvtv-new` or `build` |
| `Noke Van Co. - Crew Shots (Oct 2026).mov` (63 MB), `Noke Van Co. (Penguin Squad).mov` (456 MB) | Noke Van Photos › Crew Shots › Video | `crew` |
| `2026 Nokevan Co - Employee Highlight` videos, `What's in the garage` (14–76 MB) | Noke Van Photos › JPG | `crew`, `social` |
| Westwright / Bianchi build videos | Noke Van Photos › Westwright › Video, Bianchi › Video | `build` |
| Build Photos Portfolio › 2023 / 2024 / 2025 / 2026 (Dan) | One folder per customer build. Lots of finished-van and build photos. | `vans`, `build`, `early` (2023–2024) |
| Hi-res fire photos IMG_3131.JPG, IMG_3132.JPG (11–12 MB) | My Drive root | `fire` |

Fastest way to get the rest in: open Google Drive for Desktop and run, for example

```
npm run ingest -- "G:\My Drive\Noke Van Photos\Crew Shots\Video" --append --pool crew
npm run ingest -- "G:\My Drive\Build Photos Portfolio (add your photos)\2024" --append --pool early
```
