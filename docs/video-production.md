# BunkerMode 2-minute video — production package

Everything you need to record a world-class submission video in one sitting.
Target: 2:00 hard cap. Style: cinematic product demo with narrated voiceover.
Reference quality bar: Linear's launch videos, Cursor's product reveals.

---

## What you need to provide before recording

1. **Recording setup decision:** ScreenStudio (recommended) or Tella or Loom.
2. **Voice decision:** your own voice (best) or ElevenLabs voice clone.
3. **Face on camera?** Optional. Founder talking head adds 20% authenticity but
   adds 30% production complexity. My vote: voice-only narration over the
   screen recording. World-class without the lighting headache.
4. **Music decision:** Epidemic Sound subscription, or free Pixabay track from
   the recommendations below.
5. **Final hosting target:** YouTube unlisted (best quality), Loom, or direct
   MP4 attachment to ETHGlobal submission.
6. **Deadline:** hackathon submission timestamp.

If you give me yes/no on each of those, I will tighten the rest of this doc to
the exact path you choose.

---

## Tool stack (recommended)

| Layer | Tool | Why |
|---|---|---|
| Screen recorder | **ScreenStudio** (macOS, $89 one-time) | Automatic cinematic zoom on clicks, smooth cursor, buttery 60fps. Used by ~every YC startup demo. Worth the $89 for one weekend. |
| Voiceover | Your own + free condenser mic OR phone in a quiet room | Authenticity beats production. If you have to pick one upgrade, get a foam pop filter ($8). |
| Voice clone fallback | ElevenLabs ("Brian" or clone your own from 60s sample) | If you'd rather not record voice, this is genuinely indistinguishable in 2026. |
| Music | Epidemic Sound — search "tense build" + "minimalist piano" | One $15/mo charge, cancellable next month. Free option: Pixabay tracks "Cinematic Documentary" or "Ambient Tech". |
| Editor | ScreenStudio's built-in OR Descript for cuts | ScreenStudio handles 90% of polish automatically. Descript only if you want to fix audio takes. |

If you don't want to pay anything: **Tella (free tier, web-based)** + **Audacity** for voice + **Pixabay** music. Output will be 80% as good for $0.

---

## Pre-recording checklist (10 minutes)

Run this before you hit record:

```bash
cd /Users/ayushghiya/bunkermode

# 1. Reset the demo database to clean state
bun scripts/seed-demo.ts

# 2. Reset transient signals/events from any previous demo runs
curl -s -X POST http://localhost:3002/api/demo/reset

# 3. Make sure dev server is running on a free port
PORT=3002 bun dev
```

Browser setup:
- Chrome in **incognito mode** so extensions don't show
- Window at **1440x900** (cinematic 16:10) or **1920x1080**
- **Browser zoom 110%** — text is too small at 100% on a 1440p display
- Bookmarks bar **hidden** (Cmd+Shift+B)
- Disable notifications (DND mode on macOS)

System setup:
- DND on
- Close every unrelated app
- Hide desktop icons (or change to a clean wallpaper)
- macOS Menu Bar: hide as much as possible (or use Bartender)
- Set system volume to mute (no notification sounds during record)

Pre-stage these tabs in this order:
1. http://localhost:3002 (Home)
2. http://localhost:3002/setup
3. http://localhost:3002/demo
4. http://localhost:3002/governance-audit
5. http://localhost:3002/re-entry
6. http://localhost:3002/pricing

---

## The 2-minute script (timed, with stage directions)

Total: ~290 words at 145 wpm conversational pace. You can speed up to 155 wpm
if you go long. Read with confidence; do not rush.

### 0:00 to 0:08 — HOOK (cold open)
**Visual:** Black screen. White serif text fades in centered:
> "April 18, 2026"
> "KelpDAO drained: $292M"
> "Cascade losses: $13B in 48 hours"
Each line beats in 1.5 seconds.

**Audio (narration):**
"In April 2026, KelpDAO was drained for two-hundred ninety-two million dollars.
Innocent users lost thirteen billion in panic over the next forty-eight hours."

**Music cue:** Sparse cinematic pulse begins, very low volume.

---

### 0:08 to 0:22 — PROBLEM
**Visual:** Quick montage. 3 to 4 cuts of 1.5s each:
- Twitter / X screenshot of "DeFi is dead" tweets (use defillama or chainsec
  page screenshots if you don't have CT screenshots saved)
- Aave TVL chart dropping (use defillama.com/protocol/aave or screenshot
  from your earlier research)
- Single still: a lending market UI showing "100% utilization, withdrawals
  paused"
- End on a still: clock face at "T+46 minutes"

**Audio:**
"That's the real story of every DeFi crisis. The attacker takes one number.
The cascade takes a hundred times more. By the time Twitter lights up, you're
already locked at one hundred percent utilization. There's no panic button."

**Music:** Continues low.

---

### 0:22 to 0:32 — SOLUTION INTRO
**Visual:** Cut to BunkerMode home page. Slowly pan/scroll over the stats card
(KelpDAO direct loss, cascade outflows, Aave bad debt). Hold on the
"BUNKERMODE" wordmark for 1.5 seconds.

**Audio:**
"BunkerMode is the panic button. A user-level crisis response layer that
watches threat signals, classifies the attack, and fires your pre-staged exit
before the cascade hits."

**Music:** Light swell.

---

### 0:32 to 1:30 — DEMO (the heart of the video, ~58 seconds, ~140 words)
**Visual flow** — record this as one fluid screen capture, ScreenStudio will
auto-zoom on each click:

1. **Setup screen** (0:32-0:42): click into Setup tab, hover the "Aave rsETH
   Cascade Defender" template, click it, click "Create policy". Brief flash
   of success state.
2. **Demo console** (0:42-0:55): switch to Demo tab. Click "Start Kelp replay".
   Camera on the live log on the right side as signals stream in:
   `[t+5s] Forta alert ingested`, `[t+12s] Hypernative confirms`,
   `[t+22s] Twitter mass-mention`. Then `[t+30s] P9 classifier confirms BRIDGE_VERIFIER`.
3. **Tier escalation** (0:55-1:05): camera on the four status cards at the top.
   Watch tier go T1 → T2 → T3, attack class fill in, utilization climb past
   85%, exit route resolve to `usdc-base-cctp`.
4. **The fire moment** (1:05-1:15): when T3 fires at t+90s, freeze frame for
   half a second, on-screen text: "T3 FIRED — exit complete in 8 seconds".
5. **Module B beat** (1:15-1:25): click "Reset". Then click "Module B: trigger
   supply chain". The red refusal banner appears. Hold for 4 seconds.
6. **PnL chart** (1:25-1:30): scroll to the bottom of the demo page. Show the
   side-by-side PnL chart: protected vs unprotected. Hold for 5 full seconds —
   this is your screenshot moment.

**Audio (read at the cadence above):**

(0:32) "Pick a template. Aave rsETH cascade defender."

(0:42) "Watch the Kelp incident replay."

(0:50) "T-plus-five: Forta alert. T-plus-twelve: Hypernative confirms.
T-plus-thirty: BunkerMode classifies the attack. Bridge verifier
compromise. Recovery rate: zero."

(1:05) "T-plus-fifty: Aave WETH utilization crosses eighty-five percent.
The fast-track arms. T-plus-ninety: T-three fires. Exit complete in eight
seconds."

(1:15) "But here's what makes v2 different. When the threat is on your
device — a malicious extension, a compromised frontend — BunkerMode refuses
to fire. Stop. Isolate. Transfer from a clean machine. We know when
running is the wrong answer."

(1:25) "Three weeks later: protected wallet flat. Unprotected: down twenty-three
percent and locked out for fourteen days."

**Music:** Build slowly through the demo. Peak right at the T3 fire moment.
Drop volume during the supply chain refusal beat (lets the visual do the work).

---

### 1:30 to 1:50 — STACK
**Visual:** Cut to the v2 framework block on the home page (the ASCII tree with
"MONTHLY / ONGOING / WHEN SIGNAL FIRES / AFTER T3"). Then quick cuts:
- Architecture diagram (just the dependency graph component on the home page)
- The /governance-audit page showing the Drift Three-Question Screen
- The /re-entry page with three-layer status cards

**Audio:**
"BunkerMode v2: eleven principles, three modules. MCP-native, so any agent
can configure it through Claude. KeeperHub for execution. x402 for
pay-per-fire. Open source. Mainnet-ready."

**Music:** Resolved, holding.

---

### 1:50 to 2:00 — CTA
**Visual:** Final card. Black background. Three lines of text fading in:
> "BunkerMode"
> "When DeFi catches fire, your money is already in the stairwell."
> "github.com/ghiyaayush/bunkermode"

A single green pulsing dot in the top-right corner.

**Audio:**
"When DeFi catches fire, your money is already in the stairwell."
(brief pause)
"github.com slash ghiyaayush slash bunkermode."

**Music:** Final note lands, fades to silence on the last word.

---

## Editing pass (ScreenStudio settings)

If you use ScreenStudio, set:
- **Wallpaper:** dark gradient (#0A0E13 to match BunkerMode brand)
- **Padding:** medium
- **Cursor smoothness:** high
- **Auto-zoom on clicks:** ON
- **Click rings:** subtle, accent green (#10B981)
- **Background blur on focus:** light

Manual edits to make in post:
1. **The hook (0:00-0:08):** add a hard cut on each text line. Increase
   contrast on the white text, make the numbers slightly larger.
2. **The fire moment (1:10):** insert a 0.3s freeze frame with sound effect
   (a single low "thud" works — Pixabay search "deep impact").
3. **The Module B refusal banner (1:18):** hold for 4 seconds. Add subtitle
   text "BunkerMode refuses to fire" beneath it for emphasis.
4. **The PnL chart (1:25-1:30):** zoom in on the chart, hold full 5 seconds.
   This is the slide every judge will remember.
5. **The CTA (1:50-2:00):** make the URL line slightly larger than the
   tagline. Pulse the green dot at 1Hz.

---

## Captions (subtitles)

Bake captions into the video. Two reasons:
1. ETHGlobal judges scrub through dozens of submissions on mute
2. Twitter / X autoplays muted by default

Use **white text, drop shadow, bottom-third placement, sans-serif font**
(Inter, Geist, or SF Pro). ScreenStudio has automatic captions that are
~95% accurate; budget 5 minutes to fix the protocol names (Forta,
Hypernative, KelpDAO, etc.) which it always butchers.

---

## Thumbnail / cover image (for YouTube + Twitter)

Specs: 1280x720 PNG.

Composition:
- **Left half:** the PnL chart (red unprotected vs green protected) at 60% size
- **Right half:** big bold text:
  - "DeFi got drained"
  - "$13B lost in 48 hours"
  - "(BunkerMode wasn't there yet.)"
- **Background:** #0A0E13
- **Accent:** green underline on "BunkerMode"

I can draft the HTML/CSS for this if you want — let me know.

---

## Music recommendations (specific tracks)

**Paid (Epidemic Sound):**
- "Cinematic Tension" by Trevor Kowalski (the "Severance trailer" feel)
- "Quiet Build" by Stationary Sign
- "Liminal" by Dye O

**Free (Pixabay search terms):**
- "Cinematic Documentary Tense"
- "Ambient Tech Build"
- "Minimalist Suspense"

Avoid: anything with vocals, anything overly dramatic (no 8-bit chords,
no big drops). The product is the drama. Music is texture, not the lead.

---

## Recording day flow (45 minutes)

1. **0-10 min:** pre-recording checklist, browser setup, mic test
2. **10-15 min:** read through the script aloud twice. Find your pace.
3. **15-25 min:** record screen with ScreenStudio. **Stay silent during recording.**
   Just drive the demo. We add narration after.
4. **25-35 min:** record narration as a separate audio track, in sections.
   Match each section to a timestamp in the script.
5. **35-45 min:** assemble in ScreenStudio's editor. Add music. Export at
   1080p, 60fps, MP4.

If you hate the first take, do not edit it for an hour. Re-record. Two takes
is normal. Three is the limit.

---

## Distribution day

When the video is exported:

- **YouTube unlisted** for the master copy (best resolution)
- **Twitter / X:** clip into 3 segments at the natural cuts (hook, demo, close).
  Post the demo segment as standalone — that's the viral one.
- **Farcaster:** the supply chain refusal moment (1:15-1:25) as a 10-second loop.
  That's the screenshot moment for builders who care about safety.
- **ETHGlobal submission:** embed Loom or YouTube link in submission.
- **GitHub README:** add a thumbnail link at the top of the README pointing to
  the video.

---

## Final notes from me

A "world class" 2-minute product video has three properties:

1. **The first 5 seconds make the viewer stop scrolling.** The Kelp numbers
   in the cold open do that. Do not soften them.
2. **The demo speaks louder than the narration.** When you record the screen,
   the actions you take must be deliberate, not jittery. Slow your mouse
   movements. Click with intent.
3. **The last 3 seconds are what gets remembered.** The PnL chart + the URL.
   Hold them long enough that someone could pause and screenshot.

If you give me your decisions on the six items at the top (recording tool,
voice, face on camera, music, hosting, deadline), I'll tighten this doc to
exact step-by-step instructions for your specific path.
