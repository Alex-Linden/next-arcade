# Next Arcade

A tiny **Next.js** arcade to (re)learn the stack by building small games.
Currently includes **Tic-Tac-Toe** (Classic + Bolt rules) and **2048**. Snake is next. 🐍

---

## Tech Stack

* **Next.js (App Router)** + **TypeScript**
* **Tailwind CSS v4** + `tailwindcss-animate` plugin
* **shadcn/ui** components
* Lightweight, reducer-driven game logic (pure functions + React `useReducer`)
* Client-only randomness to keep SSR hydration stable

---

## Getting Started

```bash
# 1) Install deps
npm install

# 2) Start dev server
npm run dev

# 3) Build / run prod
npm run build
npm run start
```

**Node:** use Node **18.18+** or **20+**.

---

## Project Structure (high level)

```
app/
  layout.tsx
  page.tsx
  games/
    tic-tac-toe/
      page.tsx
    2048/
      page.tsx

components/
  layout/
    site-header.tsx            # app chrome
  game-card.tsx                # home "cabinet" cards

  games/
    tic-tac-toe/
      Game.tsx                 # UI & interactions
      state.ts                 # reducer (actions, persistence hooks)
      logic.ts                 # pure helpers (win checks, queues)
    2048/
      Game.tsx
      state.ts
      logic.ts

lib/
  utils.ts                     # cn() etc.

public/
  # assets (if any)

app/globals.css                # Tailwind v4 imports, theme tokens, helpers
```

> If your `site-header.tsx` still lives at `components/site-header.tsx`, that’s fine—move into `components/layout/` when convenient.

---

## Styling & Theme

Tailwind **v4** single import + plugin (in `app/globals.css`):

```css
@import "tailwindcss";
@plugin "tailwindcss-animate";
```

Custom tokens + “arcade” helpers live in this file. Primary accent is driven by:

```css
:root {
  --arcade-primary: 268 84% 62%; /* purple/violet */
  --primary: hsl(var(--arcade-primary));
  --ring: hsl(var(--arcade-primary) / 0.60);
}
.dark {
  --primary: hsl(var(--arcade-primary));
  --ring: hsl(var(--arcade-primary) / 0.80);
}
```

Change the vibe by updating `--arcade-primary`. Background helpers:

* `.bg-arcade` — soft color blobs/fade
* `.bg-grid` — faint grid overlay

---

## Installed shadcn/ui Components

`button`, `card`, `separator`, `dialog`, `toggle-group`, `navigation-menu`, `sheet` (etc).

Add more any time:

```bash
npx shadcn@latest add <component-name>
# e.g.
npx shadcn@latest add radio-group dropdown-menu toast
```

---

## Games

### Tic-Tac-Toe

* **Modes:**

  * **Classic** — normal play with **Undo**.
  * **Bolt (GiiKER)** — each player may have **max 3 marks**; on the 4th, the **oldest** mark is removed. No draws; **Undo disabled**.
* **UX:** winning squares highlight; delayed **win dialog** (Play again / Keep board).
  X and O have distinct gradients; Bolt shows a dot on the **oldest** current piece.
* **State:**

  * `mode: "classic" | "bolt"`
  * `xQueue` / `oQueue` (FIFOs, used only in Bolt)
  * per-mode scores in `localStorage`

**Local storage keys**

* Scores (classic): `next-arcade:tictactoe:scores:classic`
* Scores (bolt): `next-arcade:tictactoe:scores:bolt`

### 2048

* **Board:** flat array of length **16** (4×4), `0` = empty.
* **Moves:** pure helpers for left/right/up/down (merge once per move).
* **Win flow:** first win at **2048**, then **Keep playing** doubles the **next win target** (4096 → 8192 → …), preventing repeat popups.
* **Controls:** Arrow keys / WASD; swipe on touch.
* **Dialogs:** Win (Keep playing / New game) and Lose (Try again).

**Hydration-safe init:**
`initialState()` is deterministic (empty board).
The page **spawns tiles on mount** (client effect), avoiding SSR randomness.

> Optional dev helper: `createNearWinBoard()` builds a board with two `1024`s ready to merge, for testing the win dialog.

---

## Accessibility

* Live status updates via `aria-live="polite"`.
* Focus styles use your theme ring token.
* Buttons/controls have accessible labels.

---

## Common Pitfalls & Fixes

* **Hydration error (random tiles):** Do **not** call `Math.random()`/`Date.now()` during server render.
  Keep `initialState()` static; spawn on client in `useEffect`.

* **Tailwind v4 imports:** Use **either** `@import "tailwindcss";` **or** the old `@tailwind base/components/utilities` trio, **not both**. We use the single import.

* **Animations plugin:** install and register as a plugin:

  ```bash
  npm i -D tailwindcss-animate
  ```

  ```css
  @plugin "tailwindcss-animate";
  ```

* **Next `<Link>` deprecation:** don’t use `legacyBehavior`. If needed:

  ```bash
  npx @next/codemod@latest new-link .
  ```

---

## Add a New Game (pattern)

1. **Scaffold**

   ```
   app/games/<name>/page.tsx
   components/games/<name>/{Game.tsx,state.ts,logic.ts}
   ```
2. **Model** minimal state in `state.ts` + pure helpers in `logic.ts`.
3. **UI** in `Game.tsx` using shadcn `Card`/`Dialog`.
4. **Controls** (keyboard/touch) dispatch reducer actions.
5. **Persistence** (optional) via `localStorage`.

### Next up: Snake (outline)

* Real-time loop with `setInterval` based on `speedMs`
* `snake: number[]` (head at 0), `dir/nextDir`, `food: number`
* Ticks: advance, detect food/grow, collisions, speed-up, best length

---

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # start built app
npm run lint     # (if configured)
```

---

## Roadmap

* [ ] Add **Snake** (real-time loop)
* [ ] 2048 **slide/merge animations** (tile IDs or overlay)
* [ ] Global **Settings** (theme switch, sound)
* [ ] PWA install + offline
* [ ] Scoreboard export/share

---

## Contributing / Notes

* Keep game logic **pure** and UI in components.
* When adding features that use randomness, do it in a **client effect** after hydration.
* Prefer **immutable updates** in reducers.

---

### License

Add your preferred license (e.g., MIT) in `LICENSE`.
