# Questly — Fantasy Prompt Engineering Platform

> Learn prompt engineering through daily fantasy missions.

<p align="center">
  <img src="public/images/questly-removebg-preview.png" width="300px" height="300px" alt="Questly" />
</p>

<p align="center">
  <a href="https://questly-realm.vercel.app"><strong>🌐 Live — Questly Realm</strong></a>
</p>

<p align="center">
  <a href="https://buymeacoffee.com/michelesanc" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40" />
  </a>
</p>

---

## What is Questly?

Questly is a gamified web platform that teaches **prompt engineering** and **GenAI** skills through immersive daily missions set in a fantasy world. Each day, a new mission challenges you to craft the perfect prompt — the AI evaluates your work across 5 dimensions and awards XP.

Sign in with **Google** to unlock your persistent profile, earn badges, track your XP and level, and compete on the global leaderboard — powered by **Supabase** — evaluated by **Cloudflare**.

| | |
|---|---|
| **Stack** | Next.js 15 (App Router) + TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Framer Motion 11 |
| **Auth** | Supabase + Google OAuth |
| **Database** | Supabase PostgreSQL |
| **AI Evaluation** | Cloudflare AI |
| **Missions** | Custom quests generated (difficulty 1–5 stars) based on npcs |

---

## Features

### Fantasy World
- Illustrated village that transforms between **dawn** (light mode) and **night** (dark mode — to be **in progress**).

### Daily Mission System
- One mission per day — deterministic rotation, same for all users
- **lots of missions** across 8 categories:
  - `prompt-basics` · `context-crafting` · `chain-of-thought` · `role-prompting`
  - `few-shot` · `output-formatting` · `multimodal` · `agents`
- Difficulty 1–5 stars · Weekend missions are harder (difficulty 4–5)
- Fantasy narrative + concrete task + hints

### AI Evaluation
- Submit your prompt → scored on 5 dimensions (0–100 each):
  - **Creativity** · **Precision** · **Context** · **Structure** · **Prompt Engineering**
- Narrative feedback + improvement suggestions
- XP awarded based on score × difficulty

### Gamification
- User profile with nickname, XP, level, streak
- Trophies system (first mission, week streak, arcane engineer, mythic builder...)
- Badge system: Apprentice → Prompt Knight → Arcane Engineer → Mythic Builder
- World unlock system: village evolves with your progress
- Leaderboard

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page
│   ├── layout.tsx            # Root layout + theme init
│   ├── globals.css           # Tailwind + custom CSS vars
│   └── api/
│       ├── mission/route.ts  # GET /api/mission
│       └── evaluate/route.ts # POST /api/evaluate
├── components/
│   ├── fantasy-world/        # VillageScene, ThemeToggle, AmbientEffects
│   ├── mission-system/       # MissionCard, MissionInput, EvaluationResult
│   ├── ui/                   # Button, StarRating, ScoreDisplay, XPBar, BadgeDisplay
│   ├── profile/              # ProfileHeader, TrophyNotification
│   ├── auth/                 # NicknameSetup modal
│   └── leaderboard/          # Leaderboard component
├── lib/
│   ├── daily-mission.ts      # Deterministic daily rotation
│   ├── evaluate.ts           # Cloudflare
│   ├── missions.ts           # Mission accessors
│   ├── auth.ts               # Supabase
│   ├── progression.ts        # XP, level, trophy engine
│   ├── badges.ts             # Badge system
│   └── worldUnlocks.ts       # Village unlock logic
├── data/
│   └── missions.json         # missions
└── types/
    └── index.ts              # TypeScript interfaces
```

---

## Roadmap

| Phase | Feature | Status |
|---|---|---|
| MVP | Daily missions + AI evaluation | Done |
| Post-MVP | Auth + profile + progression + trophies | Done |
| v2 | Real database (Supabase / PlanetScale) | Done |
| v2 | Multiple OAuth | Done |
| v2 | Cloudflare API evaluation | Done |
| v3 | Social leaderboard + friends | Done |
| v3 | Guild system | In progress |
| v3 | Boss and PvP system | Planned |
| v3 | Mission creation by community | Planned |


---

## License

MIT
