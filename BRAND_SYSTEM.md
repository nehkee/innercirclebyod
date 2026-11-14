# INNER CIRCLE — BRAND SYSTEM
## Complete Visual Identity & Design Direction

---

## 01 — THE CONCEPT

Inner Circle is not a fan club. It is a **digital cult with cultural authority**.

The brand exists at the intersection of:
- **Nigerian street culture** — rough, raw, earned, not performed
- **Underground luxury** — no logos, no noise, just access
- **Dystopian internet** — dark web aesthetic, secret channels, coded language
- **Elite music culture** — Boiler Room, Opium, Corteiz, NTS, Travis Scott Utopia

The brand should feel like you found something you weren't supposed to find. Like a restricted file. Like a backroom that doesn't advertise itself.

---

## 02 — COLOR SYSTEM

### Primary Palette

| Name          | Hex       | Usage                                                                 |
|---------------|-----------|-----------------------------------------------------------------------|
| `ic-black`    | `#080808` | Background base — near-black, not pure black. Always the floor.      |
| `ic-gold`     | `#C9A84C` | Primary accent — headlines, CTAs, tier badges, active states          |
| `ic-red`      | `#CC0000` | Urgency, VANGUARD tier, sold-out states, danger signals                |
| `ic-dark`     | `#111111` | Card backgrounds, secondary surfaces                                  |
| `ic-gray`     | `#1A1A1A` | Subtle panel fills, hover states                                      |
| `ic-border`   | `#2A2A2A` | Dividers, card borders, structural lines                              |
| `ic-muted`    | `#666666` | Secondary text, meta labels, timestamps                               |
| `ic-silver`   | `#9CA3AF` | Body copy, INITIATE tier, supporting text                              |
| `ic-white`    | `#FFFFFF` | Headlines, SOVEREIGN tier, maximum emphasis                            |

### Tier Accent Colors
```
INITIATE   #9CA3AF  — silver, entry level, understated
INSIDER    #C9A84C  — gold, aspirational, most popular
VANGUARD   #CC0000  — red, aggressive, committed
SOVEREIGN  #FFFFFF  — white, pure, untouchable
```

### Color Philosophy
- **Never use pure black `#000000`** — always `#080808` or darker grays
- Gold is earned, not decorative — use sparingly as a signal of importance
- Red signals scarcity and urgency only — do not use it for decoration
- White means maximum tier or maximum emphasis — reserve it
- Overlays are always gold-tinted (`rgba(201,168,76,0.05-0.1)`) never blue or white

---

## 03 — TYPOGRAPHY

### Font Stack

```
PRIMARY:   Bebas Neue      — all headlines, all caps, architectural impact
SECONDARY: Space Grotesk   — body, descriptions, UI elements
MONO:      JetBrains Mono  — labels, meta info, tracking data, codes, badges
```

### Usage Rules

**Bebas Neue** — the voice of the brand
- Sizes: `clamp(48px, 10vw, 130px)` for section heads
- Always uppercase, never mixed case
- Letter spacing: tight to normal (`-0.02em` to `0.05em`)
- Used for: page titles, section headers, tier names, event titles, CTAs

**JetBrains Mono** — the system speaks
- Size range: `9px` to `13px` for UI, `14px` max for callouts
- Letter spacing: always wide (`0.2em` to `0.5em`)
- Uppercase only for labels and section identifiers
- Used for: member handles, tier labels, timestamps, ticket codes, stat labels, badges

**Space Grotesk** — human voice
- Weight range: 300 (body) to 600 (emphasis)
- Normal letter spacing for body, slightly tracked for subheads
- Used for: descriptions, bios, benefits, testimonials, all long-form text

### Type Scale

```
hero-xl:    clamp(80px, 18vw, 260px)   — INNER CIRCLE hero
section-xl: clamp(48px, 10vw, 130px)   — section headings
card-lg:    clamp(32px, 5vw, 60px)     — featured card titles
card-md:    24px–36px                   — card headings
label:      9px–11px mono              — section labels
body:       14px–16px space grotesk    — body text
caption:    10px–12px mono             — timestamps, meta
```

---

## 04 — MOTION LANGUAGE

### Core Principles
1. **Slow is premium** — fast motion signals cheapness
2. **Everything from below** — entrances come up (`y: 60 → 0`), never from sides
3. **Stagger is hierarchy** — elements reveal in reading order
4. **Once, not loop** — most animations fire once on scroll-enter
5. **Ease curves matter** — `[0.22, 1, 0.36, 1]` (expo out) for text reveals; `power3.out` for GSAP

### Animation Catalogue

| Effect              | Trigger      | Duration | Library      | Config                                  |
|---------------------|--------------|----------|--------------|-----------------------------------------|
| Hero text reveal    | Mount        | 1s       | Framer       | `y: '110%' → 0`, overflow hidden clip   |
| Section fade-up     | Scroll enter | 0.7s     | Framer/GSAP  | `opacity: 0, y: 60 → 0`                 |
| Stagger cards       | Scroll enter | 0.7s ea  | Framer/GSAP  | `delay: i * 0.1`                        |
| Counter count-up    | Scroll enter | 2.2s     | GSAP         | `power3.out`, `onUpdate` DOM write      |
| Capacity bar        | Scroll enter | 1.2s     | GSAP         | `scaleX: 0 → fill`, `transformOrigin: left` |
| Ticker marquee      | Continuous   | 28–55s   | CSS          | `translateX(0 → -50%)` loop             |
| Glitch effect       | 4s cycle     | 0.05s    | CSS @keyframe| `clip-path` slice + translate ±4px      |
| Gold shimmer        | Continuous   | 4s       | CSS @keyframe| `background-position` shift             |
| Scroll parallax     | Scroll       | realtime | Framer       | `useTransform(scrollY, [0,700], [0,-140])` |
| Custom cursor       | mousemove    | realtime | RAF loop     | lerp factor 0.12 for ring lag           |

### Hover States
- Cards: `border-color → ic-gold/40`, `background opacity +0.2`
- Headlines: `color → ic-gold`, `duration: 400ms`
- Links: `color → ic-gold`, underline optional
- Buttons: fill slide `scaleX: 0 → 1` with `transformOrigin: left`
- Tier cards: border glow with tier color on hover

### Page Transitions
- Entrance: `opacity 0→1, translateY 20→0, 600ms ease`
- Use `AnimatePresence` wrapper on layout for route changes

---

## 05 — VISUAL DIRECTION

### Photography Style
- **Color grade**: heavy desaturation with gold/amber highlight push
- **Contrast**: high — deep blacks, blown highlights on key elements
- **Mood**: dimly lit rooms, concert fog, close-ups of hands and faces
- **Avoids**: bright, colorful, daylit, clean backgrounds, stock photos
- **References**: Travis Scott Utopia behind-the-scenes, Skepta NTS sessions, underground London rave photography

### Art Direction Principles
1. **Negative space as luxury** — don't fill every pixel
2. **Grid systems always** — CSS grid overlays, alignment is precision
3. **Text as graphic element** — oversized Bebas as visual texture
4. **No stock imagery** — if no real photo, use typographic placeholders
5. **Film grain is texture** — always include noise overlay at 3.5% opacity
6. **Scanlines for depth** — horizontal scan animation over hero sections

### Background Treatments
- Base: `#080808` always
- Radial glow: `radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)` — gold haze
- Grid: `rgba(255,255,255,0.025)` 60px grid lines — barely visible structure
- Noise: animated SVG fractal noise at 3.5% opacity
- Vignette: `radial-gradient(ellipse at center, transparent 30%, #080808 90%)`

---

## 06 — ICONOGRAPHY

### Philosophy
- No icon libraries for decorative purposes
- Icons serve only functional roles: status indicators, navigation, data
- Preferred set: **Lucide React** (light weight, clean, geometric)
- Size: `8px`–`16px` max within UI
- Color: always matches surrounding text — never standalone color pop

### Brand Symbols
- `◯` — The circle, the brand's signature signifier
- `✦` — Diamond point, used as separator in tickers and labels
- `—` — Em dash, used as bullet alternative in manifesto/rules
- `·` — Middle dot, separator in meta strings
- `→` — Arrow right, navigation and CTA suffix

---

## 07 — MEMBERSHIP CARD CONCEPTS

### INITIATE — Entry Level
- Material: Matte black digital card (PDF/PNG)
- Color: Silver (#9CA3AF) border on black
- Text: Bebas Neue, all caps
- Contains: Member handle, tier, entry date, member ID
- Finish: Clean, minimal, no flourishes

### INSIDER — Mid Level
- Material: Digital gold-foil effect card
- Color: Gold border gradient, subtle gold shimmer on name
- Contains: Member handle, tier, ID, QR code for events
- Finish: Premium — gold shimmer CSS animation in digital format

### VANGUARD — High Level
- Material: Metallic dark red, textured digital
- Color: Red accents, white text
- Contains: All above + season badge
- Finish: Aggressive, high contrast

### SOVEREIGN — Top Level
- Material: All-white physical membership card (actual plastic, mailed)
- Color: White embossed text, black details
- Contains: Full name, SOVEREIGN badge, personal serial number
- Finish: Maximal — one card, no color, just quality

---

## 08 — EVENT POSTER DIRECTION

### Template Structure
```
[TOP THIRD]   Artist name / event type — mono, tracked, small
[MID THIRD]   Event name — Bebas Neue massive, fills frame
[BOTTOM THIRD] Date · Location · Price · QR/Access info
```

### Style Rules
- Background: near-black with single color accent (gold or red based on event type)
- No more than 3 font sizes per poster
- Bleed to edge on all sides — no white margins
- If photography is used: black and white, grain added, heavy contrast
- Capacity or exclusivity indicator bottom-right: `— 150 ONLY —`
- Each album season can have its own visual universe (e.g. red fog, sharp typography)

### Event Type Visual Keys
```
LISTENING PARTY  — gold, intimate, "PRIVATE SESSION"
UNDERGROUND SHOW — red, high energy, "LIMITED ACCESS"
FAN HANGOUT      — silver/gray, relaxed, "INNER CIRCLE ONLY"
STUDIO SESSION   — white, clinical, "CLOSED DOORS"
INDUSTRY EVENT   — white + gold, prestige, "INVITATION ONLY"
SECRET EVENT     — all black, minimal text, lock icon
```

---

## 09 — SOCIAL MEDIA DIRECTION

### Platform Priority
1. **Twitter/X** — Primary voice. Short, sharp, coded language. No hashtags.
2. **Instagram** — Visual documentation. Concert/studio photography only.
3. **TikTok** — Behind-the-scenes moments. Raw, unpolished.

### Content Pillars
- **Access** — Previews, member-only content, early announcements
- **Studio** — The artist's creative process, studio sessions, production content
- **Circle** — Community leaderboard highlights, member spotlights
- **Drop** — Merch/music releases, event announcements

### Copy Voice

Do:
```
"THE CIRCLE IS CLOSED. WAS IT OPEN FOR YOU?"
"48H WINDOW OPENS AT MIDNIGHT. INSIDER+ ONLY."
"FIRST LISTEN. NO PHONES. NO EXCUSES."
"YOU ALREADY KNOW."
```

Don't:
```
"Exciting news!"
"Don't miss out!!"
"Link in bio for details"
"[GIVEAWAY] Like and follow to enter"
```

### Caption Format
```
[ANNOUNCEMENT]
ALL-CAPS HOOK LINE
———
Details in mono-style lowercase
Date / time / access level
———
the site link
```

---

## 10 — MERCH DIRECTION

### Design Philosophy
- **Less is more** — single wordmark or emblem, never cluttered
- **Quality over loud** — brand doesn't need to scream
- **Members-only exclusivity** — every piece is a receipt of membership

### Capsule Concepts

**INITIATE Series** (Baseline tier)
- Black heavyweight tee, chest embroidery: `INNER CIRCLE` in Bebas, 2cm tall
- Black joggers: `INITIATE` text down leg, 1cm tall
- Palette: all black, silver thread

**INSIDER Series** (Mid tier)
- Vintage-wash black tee: `INNER CIRCLE ◯` — oversized front graphic, gold print
- Hoodie: `INSIDER` on back neck, `THE CIRCLE NEVER BREAKS` sleeve print
- Palette: black, gold print

**VANGUARD Series** (High tier)
- Military-style overshirt: `VANGUARD` patch on back
- Washed black cap: embossed `INNER CIRCLE` on front, `◯` on strap
- Palette: black, red accent

**SOVEREIGN Series** (Top tier — hand-delivered)
- Luxury garment bag with branded tissue paper
- All-black knit polo: no external logo, internal neck label only
- Woven membership tag: serial number, member name, year
- Palette: black only, white label

### Packaging
- Matte black box, debossed `IC` mark
- Gold tissue paper
- QR code card inside: links to member portal, scans to verify authenticity
- Sticker seal: `PROPERTY OF THE INNER CIRCLE`

---

## 11 — DESIGN PRINCIPLES (THE 10 LAWS)

1. **EARN THE ATTENTION** — every element must deserve to be on screen
2. **BLACK IS THE CANVAS** — `#080808` as the foundation, always
3. **GOLD IS A SIGNAL** — use it to direct the eye to what matters most
4. **MONO IS THE SYSTEM** — JetBrains Mono for anything that feels technical or official
5. **BEBAS IS THE VOICE** — every major statement in Bebas Neue, all caps
6. **SLOW IS PREMIUM** — animate with intention, not speed
7. **SCARCITY IS THE MESSAGE** — limited, exclusive, not for everyone
8. **NEGATIVE SPACE IS LUXURY** — don't fill what doesn't need filling
9. **THE GRID NEVER LIES** — maintain invisible grid structure in all layouts
10. **IF IT DOESN'T SERVE THE CIRCLE, CUT IT** — no decorative fluff

---

## 12 — ENVIRONMENT VARIABLES

See `.env.local.example` for the current, annotated list.

---

*Inner Circle — Brand System v2.0 (artist-neutral)*  
*For internal use only. Do not share outside the circle.*
