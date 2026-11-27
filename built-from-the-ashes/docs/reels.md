# Reels / TikTok / Shorts package — "Built From The Ashes"

Four vertical cuts (1080x1920, 30 fps, H.264 + AAC) rendered from the same timeline. All are under 60 s,
so each one works as an Instagram Reel, a TikTok, a YouTube Short, and a Facebook Reel without re-cutting.
Each ends with a 1 to 1.5 s audio fade and fade to black. Post with the original audio; do not let the app
replace it with library music.

| File | Length | What happens | Post it |
| --- | --- | --- | --- |
| `ReelHook.mp4` | 35 s | "They said it was over" over the old shop, hard cut to the building in flames, logo hit on "Let's go!", beat cuts until the verse drops | First. It is the trailer. |
| `Reel26Days.mp4` | 30 s | "Kept the whole crew paid", then the 1 to 26 counter on "Twenty-six business days", through "watch the whole crew rise" | Second. Strongest story beat. |
| `ReelChorus.mp4` | 20 s | One cut per beat: vans, crew, logo | Third. Pure energy, good for a sound-on repost. |
| `ReelSomeday.mp4` | 32 s | Slow dissolves, "Someday is a decision.", straight into the final chorus | Fourth. The emotional one. Good for LinkedIn and Facebook too. |

Suggested cadence: one every 2 to 3 days, with the full video going up on YouTube the same day as Reel 1
and linked from every caption.

## Captions

Keep the first line short. On Instagram and TikTok only the first line shows before "more".

### 1. ReelHook

```
They said it was over.

On April 4, 2025 a fire took our whole shop. This is the first 35 seconds of the story we made about what happened next. Full video on YouTube, link in bio.

#NokeVanCo #BuiltFromTheAshes #VanLife #CamperVan #Roanoke #SmallBusiness #Comeback #Sprinter #VanBuild
```

### 2. Reel26Days

```
26 business days.

That is how long it took to go from a pile of ashes to a crew back on the floor with tools in their hands. We kept every employee. The hometown showed up. Full video on YouTube, link in bio.

#NokeVanCo #BuiltFromTheAshes #Roanoke #SmallBusiness #Comeback #VanLife #CamperVan #BlueRidge
```

### 3. ReelChorus

```
NOKE VAN CO. We don't back down. 🔊

Built it from the ground in a Blue Ridge town. Full song and video on YouTube, link in bio.

#NokeVanCo #BuiltFromTheAshes #VanLife #CamperVan #VanBuild #Sprinter #Roanoke #Adventure
```

### 4. ReelSomeday

```
Someday is a decision.

It was never about the vans. It is about the dad taking his kids to Yellowstone. The couple watching sunrise somewhere unknown. We build the wheels to get you there. Full video on YouTube, link in bio.

#NokeVanCo #BuiltFromTheAshes #VanLife #Adventure #CamperVan #Roanoke #LiveYourAdventure
```

## Platform notes

| Platform | Max length | Cover | Notes |
| --- | --- | --- | --- |
| Instagram Reels | 90 s | pick the fire frame | Add "Original audio" name: Built From The Ashes — Noke Van Co. Tag location Roanoke, VA. |
| TikTok | 10 min | same | Turn off "allow others to use this sound" if you want to keep the song exclusive; otherwise leave it on for reach. |
| YouTube Shorts | 60 s (all four qualify) | auto | Title = first caption line. Add `#Shorts` to the description. Link the full video with the "Related video" option. |
| Facebook Reels | 90 s | same | Cross-post from Instagram if the accounts are linked. |
| LinkedIn | 10 min | same | Post Reel 4 or Reel 2 natively with a longer caption about keeping every employee. |

Safe zones: the apps overlay their UI on the bottom 20 percent and the top 10 percent. The counter, the logo hit and the text cards are centered, so nothing important is hidden.

## Before posting (same list as the long video)

- Confirm the Suno account that generated the song is on a paid plan, which is what grants commercial use.
- Quick OK from the people visible in the shop camera frames and the crew photos.
- Watch each Reel once on a phone. If the pacing of a cut needs to change, edit `cutdowns` in `timeline.json` and run `npm run reels`.

## Handoff prompt (paste into ChatGPT or any agent that can post for you)

```
You are posting a four-part short-video series for Noke Van Co., a custom camper van builder in Roanoke, Virginia, whose shop burned down on April 4, 2025 and reopened 26 business days later. The files and captions are attached (reels.md has the captions and the order). Post ReelHook first, then Reel26Days, ReelChorus, ReelSomeday, one every 2 to 3 days, to Instagram Reels, TikTok, YouTube Shorts and Facebook Reels. Use the caption text exactly as written, keep the original audio, set the cover to the frame with the building in flames, tag the location Roanoke, VA, and put the YouTube link for the full video in the bio and in each caption where it says "link in bio". Do not add music, filters, auto-captions or trending sounds. Before posting anything, confirm with me that the YouTube full video is live so the links work.
```
