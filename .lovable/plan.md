## 1. Store & data model (`src/lib/store.ts`)
- Add `"treehouse"` to `GameKind`.
- Add optional `gameKind?: GameKind` on `Habit` so personal activities carry their own game (defaults to `"tree"`).
- Replace fixed `MAX_STAGE=20` with `maxStageForMonth(date)` = days in that month (28–31). Keep an exported `MAX_STAGE_CAP = 31` for SVG helpers that need a numeric upper bound. Personal activities use a separate `INDIVIDUAL_MAX_STAGE = 30`.
- 7-day account gate: on hydrate, if `daysSinceFirstOpen ≥ 7 && !hasAccount && !progressResetAt`, reset all game/habit progress (game stage/health, `completedDates`, `missedDates`, `individualLogs`, `individualStage`, logs) but keep the habits, journal, focus sessions. Set `progressResetAt` timestamp so it only fires once. Show toast on next render.
- Add `canAddPersonal(state)` helper (limit 3 without account).
- Small `setHabitGame(id, kind)` helper (used by picker on personal card).

## 2. Games
- **New** `src/components/games/TreehouseGame.tsx`: SVG treehouse built in stages — pile of resources (planks/nails) → platform → walls → roof → windows → ladder → flag. Bad-case overlays for low health: rain clouds + broken plank when health < 50 (only used by daily main game).
- Update `GameScene.tsx` + hub `GameThumb` + onboarding + personal cards to render treehouse.
- `presets.ts`: add treehouse entry to `GAMES`, extend union type.

## 3. Add-habit dialog
- Show a compact game picker (4 tiles: tree, space, cat, treehouse) for personal activities. For daily, `gameKind` is not asked (the daily game is set globally at onboarding).
- Enforce the 3-personal limit for non-account users with an inline "Create an account to add more" note that opens `AccountDialog`.

## 4. Daily route (`src/routes/daily.tsx`)
- Merge "Today's progress" bar into the game card (one unified glass-pop container: game scene on top, progress bar and count below, then last/next stage line, then habit list underneath in the same card or immediately below). Removes the standalone progress card.
- Show current stage as `Stage X / daysInMonth`.

## 5. Personal route (`src/routes/personal.tsx`)
- Each personal activity becomes a big card mirroring the daily card: large square game preview using the activity's own `gameKind`, "I did it" and "Didn't" buttons (Didn't = no-op toast, no penalty), history chips underneath.
- Add button disabled with hint once 3 activities exist and no account.

## 6. Focus (`src/routes/focus.tsx`, `FarmerGame.tsx`)
- Nudge farmer transform so he clearly stands on a ladder rung under the canopy (tighten y position, ensure z-order behind leaves).

## 7. Journal cat (`src/components/JournalCat.tsx`)
- Shrink base size by ~25% (from 92 → 68 px base).
- Replace the 6-second `setInterval` teleport with a smooth `translate` animation across a randomized path; use CSS `transition: transform 4s linear` and change target every 4s so the cat visibly runs. Yarn ball trails ahead. Avoid center rect.

## 8. Tracking (`src/routes/tracking.tsx`)
- Remove per-habit success chart.
- Monthly **calendar heatmap** for the current month: 7-column grid, each cell shaded by that day's daily completion %. Legend at bottom.
- Weekly **individual activities** bar: count per activity for the last 7 days + a small "top day" summary showing which weekday had the most activity.
- Keep focus-minutes chart but with last 15 days (was 14).

## 9. Smart notifications (`src/lib/store.ts` + `src/routes/__root.tsx`)
- Register a lightweight scheduler on app mount: at 09:00 local send a "Here's your day" nudge listing today's due count, at 21:00 send a "1 hour left — X rituals pending" if pct < 80, and after `endFocus` send a "Great focus session" note.
- Persist `lastNotifiedDate` per slot to avoid duplicates.
- All wrapped by `Notification.permission === "granted"`.

## Technical notes
- All new logic client-side, no backend touched.
- No new npm packages.
- Files touched: `src/lib/store.ts`, `src/lib/presets.ts`, `src/components/games/TreehouseGame.tsx` (new), `src/components/GameScene.tsx`, `src/components/AddHabitDialog.tsx`, `src/components/Onboarding.tsx`, `src/components/JournalCat.tsx`, `src/components/games/FarmerGame.tsx`, `src/routes/index.tsx`, `src/routes/daily.tsx`, `src/routes/personal.tsx`, `src/routes/tracking.tsx`, `src/routes/__root.tsx`.
