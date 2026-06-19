# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Localhost Quest** is a single-file, browser-based learning RPG that teaches local AI fundamentals through exploration, hands-on sandbox labs, and mastery trials. The entire experience—including a pixel-art game engine, curriculum system, virtual terminal, and progression framework—is self-contained in `localhost-quest.html` (~190 KB, 2,400+ lines).

The game teaches two core technologies:
- **Ollama**: Running LLMs locally (Acts I–II, 14 lessons)
- **ChromaDB**: Vector databases and RAG (Acts III–IV, 11 lessons, 25 total)

## Architecture Overview

The application is organized as a **single-file monolithic HTML structure** with modular data sections and a vanilla JavaScript game engine. Key components:

### 1. Curriculum Data (Lines ~594–1478)

Four separate data structures encode all educational content:

- **LESSONS** (25 lessons split across 4 acts): Each lesson contains an `id`, `act`, `idx` (within-act order), `title`, `lede` (summary), and `body` (array of blocks).
  - Block types: `h2`, `p`, `ul` (bullets), `code` (with language), `tip`, `warn`, `note`, `prism` (special callout), `diagram` (SVG reference).
  - Inline markdown: `**bold**`, `` `code` ``, `[[kbd]]` (keyboard keys).

- **DIAGRAMS** (hand-built SVGs): 10+ diagrams referenced in lessons (architecture, RAG pipeline, embeddings, etc.). Each diagram has a caption and viewBox coordinates. **Chroma gradient (`#ff5fae` → `#a06bff` → `#5fd0ff`) is reserved for ChromaDB/vector elements; amber (`#ffb061`) for Ollama.**

- **QBANK** (question bank, 100+ questions): Organized by lesson `id`. Each question has `q` (text), `a` (array of 4 answers), `c` (correct index), and `why` (explanation). Used for mastery trials (must answer 3 in a row to master a concept).

- **WORLD** (overworld definition): A 44×30 tile grid with 4 regions (acts), spawn point, NPCs, signs, lesson pads (auto-placed on a lattice), sandbox portals, and gates. Floor types: `g` (green, Act I), `f` (forge brown, Act II), `c` (cavern purple, Act III), `v` (convergence blue, Act IV), `p` (purple crossroads), `T` (terrain/trees).

- **SANDBOXES** (5 interactive lab scenarios): Each has a title, intro text, list of objectives with hints, and a `mode` (sh for bash, py for Python REPL, chat for Ollama chat mode). Commands are validated by regex in the command interpreter (see `shExec`, `pyExec`, `chatExec`).

### 2. Styling (Lines ~11–412)

- **CSS custom properties** (--bg, --panel, --amber, --teal, --chroma, etc.) define a cohesive dusk-indigo palette.
- **Font stack**: Press Start 2P (HUD/pixel), JetBrains Mono (code), Inter (prose).
- **Layout**: Fixed app shell with flexbox, view router (title, world, codex, sandbox, trials, tree).
- **Responsive**: Media queries hide sidebars on <880px, swap to mobile layout.

### 3. Game Engine (Lines ~1605–2437)

The engine is a single large closure with these subsystems:

#### State Management
- Global `S` (player state): `name`, `cls` (Tinkerer/Scholar/Architect), `xp`, `concept` (by lesson id: streak/done/opened), `read`, `sb` (sandbox progress), `met`, `qseen`.
- Async storage via `Store` adapter (supports `window.storage`, localStorage, or in-memory fallback).
- Save key: `'localhost_quest_save_v1'`.

#### Router (`go(view)`)
Five main views:
1. **world** – 2.5D canvas overworld (top-down, pixel art).
2. **codex** – Readable lesson library with sidebar nav.
3. **sandbox** – Virtual terminal with bash/Python/chat modes.
4. **trials** – Mastery quiz hub (unlock new acts by mastering all concepts in the current act).
5. **tree** – Skill constellation showing progression paths.

#### Codex (Lesson Viewer)
- `renderCodexSide()`: Generates sidebar list of all lessons grouped by act, with status indicators (open/learn/done).
- `renderLesson()`: Renders the current lesson's full content using `blockHTML()` to convert block types to DOM.
- `codeHTML()`: Light syntax highlighting for code blocks (strings, comments, keywords, numbers).
- `md()`: Inline markdown converter (`**bold**` → `<b>`, `` `code` `` → `<code>`, `[[Ctrl]]` → keyboard style).

#### World (Canvas Engine)
- **Tile grid**: 44×30 tiles, 32px per tile. Four region rects and a central crossroads.
- **Entity system**: NPCs, signs, lesson pads, sandbox portals, gates. Entities are placed procedurally on a lattice within each region.
- **Player movement**: WASD/arrows, collision-checked against walkable tiles. Smooth velocity-based movement with delta-time.
- **Rendering pipeline**: Prerender background (tiles + subtle patterns) to off-screen canvas for speed; redraw entities and player each frame. Camera follows player, clamped to world bounds.
- **Interaction detection**: Find nearest interactable within ~1.35 tiles, show context prompt (e.g., "Study · Embeddings").
- **Dialogue system**: NPC lines, optional "go to view" button at the end. Tracks which NPCs have been met (XP reward).
- **Game loop**: `requestAnimationFrame` at 60 FPS; `update(dt)` handles input and logic, `draw()` renders, `renderMinimap()` shows region overview.

#### Sandbox (Virtual Terminal)
- Emulates a minimal shell + Python REPL by parsing commands with regex.
- **Commands validated**:
  - **ollama**: `pull`, `run`, `list`, `ps`, `create`, `show`, `rm`, `stop`.
  - **curl**: Only `localhost:11434` endpoints (`/api/tags`, `/api/chat`, `/api/embed`, `/api/generate`, `/api/ps`).
  - **pip**: `install chromadb` or others.
  - **python**: Enters Python mode (`>>>` prompt); `exit()` leaves.
  - **File creation**: `nano/vi/vim Modelfile` or redirect (printf/echo/cat > Modelfile).
- **Python mode** (`pyExec`): Recognizes `import chromadb`, `chromadb.PersistentClient(...)`, `col.add(...)`, `col.query(...)`, `ollama.chat(...)`, etc. Returns mock output.
- **Objectives**: Each project has a list of objectives (e.g., `{id:'pull', label:'Download a model...', hint:'...'}`). Commands matching regex patterns mark objectives as done (`objDone(id)`).
- **State object (`sb.st`)**: Tracks sandbox-local state (models, collection flag, Modelfile flag, etc.).

#### Trials (Mastery Quizzes)
- `renderTrials()`: Shows a grid of concept cards per act. Locked acts require mastering the previous act.
- `openQuiz(id)`: Loads a question bank for that lesson; shuffles answers.
- `answer(pos)`: Check if correct; increment streak (or reset to 0). After 3 correct in a row, mark concept as done + award XP.
- Streak persistence: Questions are tracked per concept to avoid instant repeats.
- Act unlocking: Mastering all concepts in Act N unlocks Act N+1 (gate becomes passable in the world).

#### Progression & XP
- 120 XP per level.
- Reading a lesson: +20 XP.
- Correct trial answer: +5 XP.
- Mastering a concept: +40 XP.
- Meeting an NPC: +8 XP.
- Level-ups trigger toast notifications and unlock next acts.

## Adding Content

### Adding a Lesson
1. Push a new object to `LESSONS` with `id` (unique, e.g., `'oll-new'`), `act` (1–4), `idx` (order within act), `title`, `lede`, `body` (array of blocks).
2. For each block, use the appropriate key: `{h2:'...'}`, `{p:'...'}`, `{ul:[...]}`, `{code:{c:'...', lang:'bash'}}`, `{tip:'...'}`, etc.
3. If using a diagram, add it to `DIAGRAMS` (hand-craft the SVG in `svg:` property) and reference it as `{diagram:'key'}`.
4. Create trial questions in `QBANK[id]` with the same structure as existing questions.

### Adding a Sandbox Project
1. Add a new key to `SANDBOXES`, e.g., `{firstchat: {...}}`.
2. Define `title`, `sub`, `tags` (array of tag arrays, e.g., `[['oll','OLLAMA']]`), `act`, `concept` (lesson id), `intro` (intro text), `objectives` (array of objectives with `id`, `label`, `hint`).
3. Update the command interpreter (`shExec`, `pyExec`) to recognize commands for that project and call `objDone(objectiveId)` when objectives are met.
4. In `WORLD.regions`, add a sandbox entry with coordinates, e.g., `sandboxes:[{x:16,y:4,proj:'firstchat'}]`.

### Adding a World Region or NPC
1. Add a region object to `WORLD.regions`: `{act, key, name, floor, desc, rect, gate, sandboxes, npcs, signs}`.
   - `rect`: `{x, y, w, h}` in tiles.
   - `gate`: `{x, y}` (unlocked by mastering all Act lessons).
   - `npcs`: `{x, y, name, emoji, lines:[...], go:{label:'...', to:'view'}}`.
2. The world builder auto-places lesson pads on a lattice and creates entities for NPCs, signs, gates, and sandboxes.

## Key Conventions

### Identifiers
- Lesson IDs: `'<tech>-<concept>'` (e.g., `'oll-run'`, `'chr-query'`, `'rag-build'`).
- Sandbox project IDs: Short camelCase (e.g., `'firstchat'`, `'collection'`).
- Element IDs in HTML: `'view-<name>'`, `'<section>-<subsection>'` (e.g., `'codex-side'`, `'term-out'`).

### Colors
- Palette is defined in `:root` CSS and exported to JS as `COL` and `COLA` objects for tile rendering.
- **Do not use arbitrary colors**; always pull from the defined palette to maintain the dark, cohesive theme.
- Chroma gradient is **sacred** for ChromaDB references; amber for Ollama; teal for success/mastery.

### Markdown Inline
- Use `**bold**` for emphasis, `` `code` `` for inline code, `[[Ctrl]]` for keyboard keys (rendered with a distinct kbd style).
- Code blocks with language tags are syntax-tinted automatically.

### Testing
- The game has **no automated test suite**. Validation is manual:
  1. Open the HTML in a modern browser (Chrome, Safari, Firefox).
  2. Start a new game (pick name + class).
  3. Navigate the world (WASD or arrows), interact with NPCs (E or Space), step on lesson pads.
  4. Read a few lessons and attempt a trial.
  5. Enter a sandbox and run commands (watch objectives complete).
  6. Verify progression unlocks (acts should gate, levels should increase, XP should accumulate).

### Performance Notes
- The background canvas is prerendered once per world build; entities and player redraw each frame.
- At 44×30 tiles (1,320 cells), rendering is fast even on older devices.
- Entity detection (nearest interactable) is O(n) per frame but n < 100, so no bottleneck.
- Dialog and lesson rendering use `innerHTML` (not ideal for large DOMs, but safe here given small content).

## File Structure

```
localhost-quest.html (single file, ~190 KB)
├── <head> with fonts, CSS design system
├── <body>
│   ├── #app (main container)
│   │   ├── #hud (top HUD with level, mastery, nav buttons)
│   │   ├── #views (view host, mutually exclusive sections)
│   │   │   ├── #view-title (title screen & character select)
│   │   │   ├── #view-world (canvas + minimap + dialogue)
│   │   │   ├── #view-codex (lesson library)
│   │   │   ├── #view-sandbox (terminal + objectives)
│   │   │   ├── #view-trials (mastery quiz cards)
│   │   │   └── #view-tree (skill constellation)
│   │   ├── #quiz (quiz overlay modal)
│   │   └── #toast (notification queue)
│   └── <script> (all game code in one IIFE closure)
│       ├── Store (async storage adapter)
│       ├── LESSONS, DIAGRAMS, QBANK, WORLD, SANDBOXES (data)
│       ├── Game engine (router, codex, world, sandbox, trials, tree)
│       └── Input handlers & initialization
```

## No Build System

This is a **no-build, single-file HTML project**. There is no package.json, webpack, or compilation step. To modify:
1. Edit `localhost-quest.html` directly in a text editor.
2. Reload the browser (or use live-reload if available).
3. Changes are instant.

To distribute: Copy `localhost-quest.html` to any web server or open locally in a browser. Everything runs client-side; no backend needed.

## Persistence

Player progress is saved to `localStorage` under the key `'localhost_quest_save_v1'`. The `Store` adapter allows for:
- **Claude artifact mode**: `window.storage.get/set` (if available).
- **Browser localStorage**: Falls back if Claude storage is unavailable.
- **In-memory**: If neither is available, data is held in memory during the session only.

To reset a player's progress, clear the localStorage key via the browser console: `localStorage.removeItem('localhost_quest_save_v1')`.

## Future Extensions

If expanding this project, consider:
- **Modularization**: Split into separate JS files (curriculum.js, engine.js, ui.js) if it exceeds 3,000 lines, but keep the monolithic single-file approach for now (deployment simplicity).
- **Additional acts**: Acts V–VI could cover fine-tuning, multi-agent systems, or advanced RAG patterns. Follow the same LESSONS/DIAGRAMS/QBANK/WORLD/SANDBOXES pattern.
- **Internationalization**: Wrap all user-facing text in a translation function (e.g., `t(key)`) and provide locale JSON files.
- **Audio**: Add subtle sound effects for interactions (button clicks, level-ups) using the Web Audio API or data URIs for tiny beeps.
- **Mobile touch controls**: The touchpad (#touchpad) is already in the HTML but hidden on desktop; enhance for mobile UX.

---

**Last updated**: 2026-06-19  
**Lines of code**: ~2,474 (HTML, CSS, vanilla JS)  
**Browser compatibility**: Modern browsers (Chrome 90+, Safari 14+, Firefox 88+)  
**No dependencies**: 100% vanilla HTML, CSS, and JavaScript.
