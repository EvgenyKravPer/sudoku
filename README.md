# Weekly Sudoku Pack Generator

A lightweight, print-ready TypeScript web application designed to generate weekly large-print Sudoku packs—specifically tailored for seniors and people with dementia.

## Key Features
- **True Human-Logic Difficulty Grader**: Every puzzle is guaranteed to have a **strictly unique solution** and is verified by a human-technique solver (`src/sudoku.ts`) so the solver never hits an unfair guessing wall:
  - **Gentle** (44–48 clues): Solvable using direct *Naked Singles* alone.
  - **Easy** (38–42 clues): Solvable using *Naked Singles* and *Hidden Singles*.
  - **Medium** (33–36 clues): Fewer clues, still 100% solvable via *Naked & Hidden Singles*.
  - **Challenging / Accountant Level** (28–31 clues): Incorporates *Naked Pairs* and *Pointing Pairs (Box-Line Reduction)*.
- **180° Rotational Symmetry**: Clues are dug in symmetric pairs so every printed grid looks visually balanced like a professionally published puzzle book.
- **Dementia-Friendly Print Layout (`@media print`)**:
  - **1 Puzzle per Page (Extra-Large Print)** with `28pt` high-contrast bold numbers and thick `3.5px` 3×3 box borders.
  - **2 Puzzles per Page** compact option.
  - **Optional Answer Key** automatically formatted at the back of the printout (4 solutions per page).
- **Split UI / Printout Localization**: Control panel stays in English for the developer, while the printed pages default to **Russian (`ru`)** (or English (`en`)) using a single compact dictionary in `src/main.ts`.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode (Live Reload)
```bash
npm run dev
```
Open the shown local URL (usually `http://localhost:5173`). Any edits to `src/*.ts`, `src/style.css`, or `index.html` hot-reload immediately in the browser.

### 3. Build Static Production Bundle
```bash
npm run build
npm run preview
```
The compiled static files are emitted to `dist/` and can be hosted for free on GitHub Pages, Vercel, or Cloudflare Pages to use from both macOS and Windows.
