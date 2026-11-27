# YouTube publish kit — "Built From The Ashes"

Everything below is ready to paste. Items in **[brackets]** need your real value before posting.

## Before you upload

1. **Final render.** In `timeline.json` set `"debugOverlay": false`, then:
   ```
   npm run timeline:check
   npm run final          # 1920x1080, H.264 + AAC -> out/final-1080p.mp4
   ```
   That file is already in a format YouTube accepts (MP4, H.264, AAC, 30 fps). Nothing to convert.
2. **Watch it once end to end** with sound. The spots most likely to need a nudge: the logo hit at 0:20
   versus the spoken "Let's go!", and the 1 to 26 counter at 2:03.5.
3. **Music rights.** The song's metadata says it was made with Suno. Commercial use (a company channel,
   monetization) requires that the song was generated on a paid Suno plan, which grants you the rights.
   Confirm which account generated it before you publish. Keep the original `.m4a` with its metadata as proof.
4. **Permissions for faces.** The old-shop camera frames, crew photos and the customer camping shot show
   identifiable people. A quick OK from employees and the customer is cheap insurance.
5. **News footage.** If you add RVTV or TV-station clips, get written permission or keep each clip to a few
   seconds with an on-screen credit. Stations do file Content ID claims.
6. **Captions.** Upload `docs/captions-lyrics.srt` under Subtitles. It is the timed lyric track from the
   song file with the section labels removed, so viewers can read every line.
7. **Thumbnail.** 1280x720 JPG under 2 MB. Strongest frame: the building front in flames (`fire/loading-dock-fire-front`)
   with the round logo in a corner and three words of text. Render it with
   `npx remotion still BuiltFromTheAshes out/thumb.jpg --frame=380 --width 1920 --height 1080` and add the text in any editor,
   or build it in Canva.

## Title (pick one, under 100 characters)

- Built From The Ashes — Noke Van Co. (Official Music Video)
- Built From The Ashes | The Noke Van Co. Fire, 26 Business Days, and the Comeback
- They Said It Was Over. 26 Business Days Later. | Built From The Ashes

## Description

```
On April 4, 2025, a fire took our entire shop in Roanoke, Virginia. Every tool, every van in progress, everything we owned. Twenty-six business days later the crew was back on the floor with tools in their hands.

This is that story. Security-camera footage from the night of the fire, the photos we took standing in the rubble, and the vans we have built since.

Thank you to the Roanoke Valley. Every shirt, every dollar, every hand that was raised gave us one more reason to fight another day.

You can burn down a building. You can't burn down a dream.

— Noke Van Co. | Built for your adventure
Custom camper vans, built in Roanoke, VA
Website: [https://nokevanco.com]
Instagram: [@nokevanco]
Call or text: [855-NOKEVAN]
Book a build consult: [link]

CHAPTERS
0:00 Intro — "They said it was over"
0:35 Verse 1 — Started with a vision and a van in the shop
1:14 Chorus — Noke Van Co., we don't back down
1:34 Verse 2 — April fourth, twenty-five
2:03 Twenty-six business days
2:29 Chorus
2:49 Verse 3 — Back with a blueprint
3:38 Bridge — Someday is a decision
4:03 Final Chorus
4:25 Outro — The fire was never in the building

CREDITS
Song: "Built From The Ashes" — written for Noke Van Co. [produced with Suno]
Security camera footage, fire and rebuild photos: Noke Van Co.
Van photography: [JPG Agency / photographer name]
News footage: [RVTV, used with permission]
Edited with Remotion

#NokeVanCo #BuiltFromTheAshes #VanLife #CamperVan #Roanoke #SmallBusiness #Comeback
```

Notes on the description:
- The first two lines show in search results and above the fold. Keep the fire date and "26 business days" there.
- Chapters only work if the list starts at 0:00, has at least three entries, and each is 10 s or longer. The list above matches the section starts in `timeline.json`. If you move a section boundary, update the matching line.
- Delete the Suno line if you would rather not mention it, but keep it in your own records.

## Tags (paste into the Tags field, comma separated)

```
Noke Van Co, Built From The Ashes, camper van, van build, Sprinter van conversion, ProMaster conversion, Transit camper, van life, Roanoke Virginia, Roanoke VA, Blue Ridge, shop fire, rebuild, comeback story, small business, custom camper vans, van conversion company, music video, overland van, adventure van
```

## Upload settings

| Setting | Value |
| --- | --- |
| Category | Autos & Vehicles (or Music if you want it treated as a song first) |
| Audience | Not made for kids |
| Altered or synthetic content | The song's vocals are AI-generated. YouTube's disclosure is aimed at realistic synthetic people, places and events, which this is not, but ticking it costs nothing. Your call. |
| License | Standard YouTube License |
| Visibility | Unlisted first, send the link to the crew, then Public |
| Comments | On, hold potentially inappropriate for review |
| End screen | Last 20 s (from 4:31): Subscribe button + one "van tour" or "book a consult" video |
| Cards | 2:03 (counter) → link to the rebuild blog post or news story, if you have one |
| Playlist | Create "Noke Van Co. — Our Story" and put this first |
| Pinned comment | Short thank-you to Roanoke plus the consult link |

## Social cutdowns (optional)

The same project renders vertical cuts for Reels, TikTok and Shorts. The chorus (1:14 to 1:34) and the
counter line (2:03 to 2:29) are the two clips to post first.

```
npx remotion render BuiltFromTheAshes out/short-chorus.mp4 --frames=2223-2811 --width 1080 --height 1920
npx remotion render BuiltFromTheAshes out/short-26days.mp4 --frames=3705-4461 --width 1080 --height 1920
```

Vertical framing crops the sides of each 16:9 shot. For a real vertical edit, change `width`/`height` in
`timeline.json` and reduce `kenBurns` to 1.06 so the crop stays gentle.
