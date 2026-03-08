# Connect Four — Full-Stack Project Documentation

> Target audience: new developer joining the team.  
> Last updated: March 2026.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Architecture](#2-project-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Frontend Documentation](#4-frontend-documentation)
5. [Backend Documentation](#5-backend-documentation)
6. [API Endpoints](#6-api-endpoints)
7. [Game Engine](#7-game-engine)
8. [Scrapper Documentation](#8-scrapper-documentation)
9. [Database](#9-database)
10. [Replay System](#10-replay-system)
11. [AI Features](#11-ai-features)
12. [Admin Dashboard](#12-admin-dashboard)
13. [Workflows](#13-workflows)
14. [Setup and Development](#14-setup-and-development)
15. [Contribution Guide](#15-contribution-guide)

---

## 1. Project Overview

### What the project does

This project is a full-stack **Connect Four** platform. It allows users to:

- Play Connect Four locally (Human vs Human, Human vs AI, AI vs AI).
- Watch a built-in AI compute and suggest moves in real time.
- Import and replay real games scraped from **BoardGameArena (BGA)**.
- Save completed games to a central database.
- Browse, filter, and replay saved games through an admin dashboard.

### Purpose of the system

The system was built to study Connect Four game data at scale. By scraping real BGA games and storing them with their move sequences (signatures), the team can analyse opening frequencies, win rates by colour, average game length, and other statistics. The AI engine makes it possible to evaluate any board position and suggest optimal play.

### Main features

| Feature | Description |
|---|---|
| Multi-mode gameplay | AI vs AI, Human vs AI, Human vs Human |
| Local AI (Minimax) | Front-end minimax with alpha-beta pruning and transposition table |
| Server-side AI | Backend minimax for move suggestion and probability calculation |
| BGA scraper | Automated Puppeteer scraper that replays BGA table records and extracts move sequences |
| BGA replay viewer | Load any BGA table ID and step through the game move by move |
| Game persistence | Save games locally (JSON file / localStorage) or to the remote MySQL database |
| Admin dashboard | View all saved games, statistics, column frequency heatmap, and delete entries |
| Signature deduplication | Mirror-aware duplicate detection prevents the same game from being saved twice |

### Role of the AI engine

Two AI engines exist in the project:

- **Frontend engine** (`useMinimax.js`): runs entirely in the browser. Used during live gameplay (AI taking a turn) and for on-demand move suggestion with a configurable depth.
- **Backend engine** (`suggestController.js` + `probabilityController.js`): stateless REST endpoints that accept a board state and return the best column and/or win-probability percentages for both players. The backend engine is called by the frontend to display an "AI suggestion" overlay without affecting the active game.

### Role of BGA game scraping

BoardGameArena hosts thousands of Connect Four games. The scrapper automates a Chrome browser session (via Puppeteer Stealth) to:

1. Collect table URLs from a player's game history.
2. Visit each table's review/replay page.
3. Extract the raw move log from the JavaScript variable `g_gamelogs`.
4. Reconstruct the column-sequence signature and store the game data as JSON.

This pipeline feeds the database with real human-played games for statistical analysis.

### Purpose of the frontend interface

The Vue 3 SPA provides:

- A home page to start a new game, load a saved game, navigate to BGA replay, or open the admin panel.
- A game view with the live board, move log, AI thinking progress bar, and sidebar controls.
- A BGA view to enter a table ID, trigger the backend scraper, and replay the result step by step.
- A database view (admin-only) with statistics and a list of all stored games.
- A register/login view for user authentication.

---

## 2. Project Architecture

### Global architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Vue 3 SPA)                      │
│                                                                 │
│  HomeView  GameView  BgaView  DatabaseView  RegisterView        │
│       │        │        │          │                            │
│  Pinia stores (gameState, gameSettings)                         │
│       │        │        │          │                            │
│  Composables: useGame, useMinimax, useReplay, useApi, useBga   │
│                    │              │                             │
│        Local Minimax AI    HTTP fetch calls                     │
└────────────────────┼──────────────┼──────────────────────────── ┘
                     │              │
                     │    REST API (Express / Node.js)
                     │              │
          ┌──────────┘   ┌──────────┘
          │              │
          │  ┌───────────────────────────────────────────────────┐
          │  │               BACKEND (connect4_api)              │
          │  │                                                   │
          │  │  Routes → Controllers → Services → Models        │
          │  │                                                   │
          │  │  /api/games          gameController               │
          │  │  /api/suggest-move   suggestController (Minimax)  │
          │  │  /api/probability    probabilityController        │
          │  │  /api/bga/:tableId   bgaController (Puppeteer)    │
          │  │  /api/situations     situationController          │
          │  │  /user               userController (JWT auth)    │
          │  │           │                                       │
          │  │      Knex ORM                                     │
          │  │           │                                       │
          │  └───────────────────────────────────────────────────┘
          │              │
          │    ┌──────────────────────┐
          │    │  MySQL (TiDB Cloud)  │
          │    │  Tables:             │
          │    │    user              │
          │    │    partie            │
          │    │    situation         │
          │    └──────────────────────┘
          │
          │
┌─────────┴──────────────────────────────────────────────────────┐
│                 SCRAPPER (Node.js / Puppeteer)                  │
│                                                                 │
│  script.js        → collects table URLs from BGA profile       │
│  gameLogs.js      → visits each table, extracts move sequence  │
│  oneTimeScrape.js → one-off helper to log into BGA manually    │
│  antiBot.js       → random delay utility                       │
│                                                                 │
│  Output: data/game_<id>.json  +  logs/log_<id>.txt             │
└────────────────────────────────────────────────────────────────┘
```

### Data flow

| Step | From | To | Description |
|---|---|---|---|
| 1 | BGA website | Scrapper | Puppeteer browser scrapes game table pages |
| 2 | Scrapper | `data/*.json` | Move sequences saved as per-game JSON files |
| 3 | `data/*.json` | Backend (`importParties.js`) | Utility script imports scraped games into the DB |
| 4 | Frontend | Backend (`POST /api/games`) | Frontend saves a finished game directly via the API |
| 5 | Frontend | Backend (`GET /api/bga/:tableId`) | Frontend triggers an on-demand single-table scrape |
| 6 | Backend | Frontend | Game lists, stats, AI move suggestions returned as JSON |
| 7 | Frontend | Local storage | Games can also be saved as JSON to `localStorage` or downloaded as `.json` files |

---

## 3. Folder Structure

```
root/
├── connect4/              # Frontend — Vue 3 SPA
├── connect4_api/          # Backend — Express REST API
└── scrapper/              # BGA scraping scripts
```

### `connect4/` — Frontend

```
connect4/
├── index.html             # Vite entry point
├── vite.config.js         # Vite configuration (Vue + Tailwind plugins)
├── package.json
└── src/
    ├── main.js            # App bootstrap (Vue, Pinia, Router)
    ├── App.vue            # Root component (router-view)
    ├── style.css          # Global styles
    ├── assets/            # Static assets
    ├── routers/
    │   └── index.js       # Vue Router routes (/, /game, /database, /register, /bga)
    ├── stores/
    │   ├── gameState.js   # Pinia store: board, moveHistory, winner, replay state
    │   └── gameSettings.js# Pinia store: boardSize, gameMode, aiDepth, humanPlayer
    ├── composables/
    │   ├── useGame.js         # Core move logic (fillCol, startGame)
    │   ├── useGameFlow.js     # AI detection, triggerAIMove, placePiece
    │   ├── useMinimax.js      # Client-side Minimax + alpha-beta + TT
    │   ├── useWinCheck.js     # Win detection with winning-cell coordinates
    │   ├── useAi.js           # Simple random-column AI (fallback)
    │   ├── useReplay.js       # Replay controls (undo/redo/step/auto)
    │   ├── useBga.js          # BGA fetch + signature-to-moves conversion
    │   ├── useApi.js          # All HTTP calls to the backend
    │   ├── useFileManagement.js # Save/load game as JSON file or localStorage
    │   ├── useRandomGames.js  # TODO: verify in implementation
    │   └── insertAllLocalGames.js # Bulk-insert localStorage games to DB
    ├── components/
    │   ├── Board.vue          # Game board grid with per-column Minimax scores
    │   ├── Cell.vue           # Individual cell (empty / red / yellow / winning)
    │   ├── Navbar.vue         # Top navigation bar
    │   ├── NewGameSettingsModal.vue # Modal: game mode, board size, AI depth
    │   ├── QuitModal.vue      # Confirmation dialog for quitting a game
    │   ├── GameCard.vue       # Compact game summary card
    │   ├── SavedGameCard.vue  # Card for a locally saved game
    │   ├── SavedGamesList.vue # List of locally saved games on the home page
    │   ├── State.vue          # Game state display panel
    │   └── TestRandomGames.vue# TODO: verify in implementation
    └── views/
        ├── HomeView.vue       # Landing page (start game, load, BGA, database)
        ├── GameView.vue       # Main game screen (board + sidebar)
        ├── BgaView.vue        # BGA game importer and replay viewer
        ├── DatabaseView.vue   # Admin dashboard (stats + game list)
        └── RegisterView.vue   # Login / register form
```

### `connect4_api/` — Backend

```
connect4_api/
├── server.js           # Express app entry point
├── knexfile.js         # Database connection config (TiDB Cloud / MySQL)
├── package.json
├── .env                # Environment variables (SECRET, DB credentials)
├── controllers/
│   ├── gameController.js      # CRUD for 'partie' table
│   ├── bgaController.js       # On-demand Puppeteer scrape of a BGA table
│   ├── suggestController.js   # Minimax move suggestion engine
│   ├── probabilityController.js # Win-probability calculator (sigmoid-normalized)
│   ├── situationController.js # Get board snapshots for a game
│   └── userController.js      # Register, login, personal space
├── routes/
│   ├── games.js        # /api/games
│   ├── bga.js          # /api/bga/:tableId
│   ├── suggest.js      # /api/suggest-move
│   ├── probability.js  # /api/probability
│   ├── situations.js   # /api/games/:id/situations
│   └── user.js         # /user/registre, /user/login, /user/myspace
├── services/
│   └── gameService.js  # Business logic: save, dedup, stats
├── models/
│   ├── gameModel.js    # Knex queries for 'partie'
│   └── userModel.js    # Knex queries for 'user'
├── middlewares/
│   ├── auth.middleware.js    # JWT verification
│   └── isAdmin.middleware.js # Role check (admin only)
├── migrations/
│   ├── 20260202201811_create_tables.js    # Creates user, partie, situation tables
│   ├── 20260302114459_add_bga_id_to_partie.js # Stub (already applied)
│   └── 20260305000001_add_bga_fields.js  # Adds bga_table_id, board_size columns
├── seeds/
│   └── seeding.js      # TODO: verify in implementation
├── utils/
│   ├── gameUtils.js        # getCanonicalSequence, checkWin, analyzeGame
│   ├── trainingUtils.js    # generateSituation (board snapshots from signature)
│   ├── importParties.js    # Bulk-import scraped JSON files into the DB
│   ├── crypto.js           # TODO: verify in implementation
│   └── generateAdminHashedPassword.js # One-off admin password hashing utility
├── db/
│   └── knex.js         # Knex singleton instance
└── tests/              # TODO: verify in implementation
```

### `scrapper/` — Scraper scripts

```
scrapper/
├── script.js           # Step 1: collect Connect Four table URLs from BGA profile
├── gameLogs.js         # Step 2: visit each table, extract move sequence
├── oneTimeScrape.js    # Helper: open BGA homepage for manual login
├── antiBot.js          # Utility: random delay between 8–12 seconds
├── connect-four-results.json # Output of script.js (list of table URLs)
├── package.json
├── data/               # Per-game JSON files (output of gameLogs.js)
├── logs/               # Per-game scraping logs (output of gameLogs.js)
└── automation-profile/ # Persistent Chrome user profile (stores BGA login session)
```

---

## 4. Frontend Documentation

### Technologies

| Technology | Version | Role |
|---|---|---|
| Vue 3 | ^3.5 | UI framework (Composition API) |
| Pinia | ^3.0 | State management |
| Vue Router | ^4.6 | Client-side routing |
| Vite | ^7.2 | Build tool and dev server |
| Tailwind CSS | ^4.1 | Utility-first CSS |

### State management

Two Pinia stores coordinate all game logic:

#### `gameSettings` store

| State | Type | Default | Description |
|---|---|---|---|
| `gameMode` | `number` | `'random'` | `0` = AI vs AI, `1` = Human vs AI, `2` = Human vs Human |
| `startingPlayer` | `string` | `'red'` | Which player goes first |
| `boardSize` | `{rows, cols}` | `{6, 7}` | Board dimensions |
| `aiMode` | `string` | `'minimax'` | AI algorithm selection |
| `aiDepth` | `number` | `5` | Minimax search depth |
| `humanPlayer` | `number` | `1` | Which player number the human controls in PvE mode |

#### `gameState` store

| State | Type | Description |
|---|---|---|
| `board` | `number[][]` | 2D array: `0` = empty, `1` = Red, `2` = Yellow |
| `currentPlayer` | `number` | `1` or `2` |
| `gameStatus` | `string` | `'start'`, `'playing'`, `'paused'`, `'finished'`, `'replay'` |
| `winner` | `number\|null` | Winning player or `null` |
| `winningCells` | `{row,col}[]` | The four winning cell coordinates |
| `moveHistory` | `{row,col,player}[]` | Full move list (supports undo/redo) |
| `historyIndex` | `number` | Current position in `moveHistory` |
| `aiThinkingProgress` | `number` | 0–100 progress bar value for AI computation |
| `gameLogs` | `{time,message}[]` | Event journal (newest first, max 100 entries) |

Key store actions: `addMove`, `undo`, `redo`, `loadReplay`, `resetGame`, `setWinner`, `setWinningCells`.

### Main composables

#### `useGame.js`

Core move execution layer.

- **`fillCol(col)`** — Places the current player's piece in the given column. Validates column availability, updates the board, logs the move, checks for a win via `useWinCheck`, toggles the player, and fires the AI move if it is the AI's turn.
- **`startGame()`** — Registers the `fillCol` callback and triggers the first AI move if AI goes first.
- **`getMoveSequenceFromMoveHistory()`** — Serialises `moveHistory` into a column-index string (the "signature") for database storage.

#### `useGameFlow.js`

- **`isCurrentPlayerAI()`** — Returns `true` if the current player should be controlled by the AI, based on `gameMode` and `humanPlayer`.
- **`triggerAIMove(callback)`** — Schedules an AI move via `setTimeout(0)` to avoid blocking the UI thread.
- **`startAIvsAI(callback)`** — Kicks off the AI vs AI loop in mode `0`.

#### `useMinimax.js`

Client-side AI engine. See [Section 11 — AI Features](#11-ai-features) for full details.

- **`getBestMove(board, depth)`** — Synchronous minimax. Returns `{ bestCol, scores }`.
- **`getBestMoveAsync(board, depth, progressCallback)`** — Async wrapper that runs minimax per-column with `setTimeout` yielding to report progress. Returns best column.

#### `useWinCheck.js`

- **`checkProbableWin(row, col, player)`** — Checks horizontal, vertical, and both diagonal directions from the last played cell. If 4 in a row is found, calls `setWinner` and `setWinningCells` on the store and sets `gameStatus` to `'finished'`.

#### `useReplay.js`

- Controls replay via `redo()` / `undo()` on the `gameState` store.
- **`startAutoReplay()`** — Sets an interval that calls `redo()` every `replaySpeed` ms (default 700 ms).
- **`stepForward() / stepBackward()`** — Single-step navigation.
- **`goToStart() / goToEnd()`** — Jump to beginning or end of the move history.

#### `useBga.js`

- **`loadBgaGame()`** — Calls `GET /api/bga/:id` on the backend, receives the move signature, parses the board size, reconstructs the move list, and loads it into the store via `gameState.loadReplay()`.
- **`signatureToMoves(signature, rows, cols)`** — Replays a column-index string on a temporary board to compute `{ row, col, player }` for each move.

#### `useApi.js`

All HTTP communication with the backend. The base URL is `https://connect4-backend-xodq.onrender.com/api`.

| Method | Description |
|---|---|
| `fetchGames()` | `GET /api/games` — loads all games (admin token) |
| `savedGameToDatabase(extra)` | `POST /api/games` — saves the current game |
| `fetchStats()` | `GET /api/games/stats` — aggregated statistics |
| `fetchProbability(board, player, depth)` | `POST /api/probability` |
| `deleteGame(id)` | `DELETE /api/games/:id` |
| `fetchSituationsByGame(id)` | `GET /api/games/:id/situations` |

#### `useFileManagement.js`

- **`download()`** — Serialises the full game state to a `.json` file and triggers a browser download.
- **`upload(event, onSuccess)`** — Reads a `.json` file and restores all store values. Navigates to `/game` on success.
- **`save()`** — Appends the current game to `localStorage` under the key `games`.

### Main components

#### `Board.vue`

| Prop | Type | Description |
|---|---|---|
| `board` | `Array` | Current 2D board state |
| `boardSize` | `Object` | `{rows, cols}` |
| `suggestedCol` | `Number\|null` | Column highlighted as AI suggestion |
| `paintMode` | `Boolean` | Enables manual cell painting |

**Emits:** `paint-cell`

Renders column numbers at the top, the blue board frame with `Cell` components, and a row of per-column Minimax scores below the board. The scores are computed reactively when the board changes.

#### `Cell.vue`

Renders a single board cell. Shows a coloured disc (red / yellow) or empty slot. Highlights winning cells with a distinct style. Shows a directional hint arrow on the suggested column.

#### `NewGameSettingsModal.vue`

Modal dialog collecting: game mode (AI vs AI / 1P / 2P), board size, starting player, AI search depth, and human player colour. Emits a `submit` event with the collected settings object.

#### `Navbar.vue`

Top navigation bar with links to Home, Game, BGA, and Register/Login. Displays the current user role if authenticated.

---

## 5. Backend Documentation

### Framework and stack

| Technology | Version | Role |
|---|---|---|
| Node.js | runtime | JavaScript server runtime |
| Express | ^5.2 | HTTP framework |
| Knex | ^3.1 | SQL query builder / migrations |
| mysql2 | ^3.16 | MySQL driver (TiDB Cloud) |
| bcrypt | ^6.0 | Password hashing |
| jsonwebtoken | ^9.0 | JWT authentication |
| puppeteer-extra | ^3.3 | Headless browser for BGA scraping |
| puppeteer-extra-plugin-stealth | ^2.11 | Anti-bot detection bypass |
| dotenv | ^17.3 | Environment variable loading |

### API architecture

```
server.js
   ├── /api/games         → routes/games.js       → gameController.js
   ├── /api/situations    → routes/situations.js  → situationController.js
   ├── /api/bga           → routes/bga.js         → bgaController.js
   ├── /api/suggest-move  → routes/suggest.js     → suggestController.js
   ├── /api/probability   → routes/probability.js → probabilityController.js
   └── /user              → routes/user.js        → userController.js
```

Middleware chain (where applied): `auth` (JWT verification) → `isAdmin` (role check) → controller.

### Authentication

- **`auth.middleware.js`**: Reads `Authorization: Bearer <token>` header, verifies the JWT against `process.env.SECRET`, attaches `{ id, role }` to `req.user`.
- **`isAdmin.middleware.js`**: Checks `req.user.role === 'admin'`. Returns 403 otherwise.
- Tokens expire after 1 day. Role is included in the token payload and also returned in the login response for the frontend to cache in `localStorage`.

### Game service (`gameService.js`)

The service layer handles:

1. **Player normalisation** — converts `1`, `'red'`, `'R'` → `'R'` and `2`, `'yellow'`, `'Y'` → `'Y'`.
2. **Signature validation** — ensures the move-sequence string is non-empty and ≤ 255 characters.
3. **BGA deduplication** — checks `bga_table_id` uniqueness first (fastest path).
4. **Mirror deduplication** — computes the mirror image of the signature (each column index reflected: `newCol = numCols + 1 - col`) and checks whether either the original or the mirror already exists. The canonical form (lexicographically smallest of the two) is what makes two games "the same".
5. **Insert** — delegates to `gameModel.insertPartie`.

### How a move is processed (live gameplay)

1. User clicks a column in `Board.vue`.
2. `handleCellClick` calls `fillCol(col)` from `useGame.js`.
3. `fillCol` iterates the column from bottom row upward to find the first empty cell.
4. The piece is placed in `board[row][col]`.
5. `addMove(row, col, player)` appends to `moveHistory` and advances `historyIndex`.
6. `checkProbableWin(row, col, player)` scans four directions. If a win is found, `setWinner` and `setGameStatus('finished')` are called.
7. `currentPlayer` is toggled.
8. If the new current player is the AI, `triggerAIMove` schedules the AI computation via `setTimeout(0)`.
9. The AI calls `getBestMoveAsync(board, depth)` which runs the frontend minimax. The resulting column is passed to `fillCol`.

### How the backend AI computes a move (`suggestController.js`)

1. `POST /api/suggest-move` receives `{ board, depth, aiPlayer }`.
2. The board is deep-cloned.
3. Columns are tried in centre-first order.
4. For each column: the piece is placed, `checkWin` is evaluated immediately (returns `WIN_SCORE + depth` if the move wins), otherwise `minimax` is called recursively.
5. The piece is removed (in-place mutation + reset, no array copying per node).
6. The column with the highest score is returned as `bestCol` along with the per-column `scores` array.

### How probabilities are calculated (`probabilityController.js`)

1. `POST /api/probability` receives `{ board, currentPlayer, depth }`.
2. The same minimax engine evaluates all legal columns for `currentPlayer`.
3. The best score `bestScore` is converted to a 0–100 win percentage via a linear sigmoid:
   ```
   t = (clamp(bestScore, -WIN_SCORE, WIN_SCORE) + WIN_SCORE) / (2 * WIN_SCORE)
   probability = round(t * 100)
   ```
4. The complementary probability is assigned to the opponent.
5. Response: `{ red: 0-100, yellow: 0-100, score, bestCol, colScores }`.

### How replay data is stored

When a game is saved (`POST /api/games`), the move sequence is stored as the `signature` field (a plain string of column indices). No snapshot-per-move is stored at save time. Board snapshots per move are generated on demand by `trainingUtils.generateSituation(signature)` and stored in the `situation` table, keyed by `id_partie`.

---

## 6. API Endpoints

### Health check

| | |
|---|---|
| **Route** | `GET /` |
| **Auth** | None |
| **Response** | `{ "message": "Connect4 api is working" }` |

---

### User endpoints — prefix `/user`

#### Register

| | |
|---|---|
| **Route** | `POST /user/registre` |
| **Auth** | None |
| **Body** | `{ username, email, password, role? }` |
| **Response 201** | `{ message: "success creating the user", userId }` |
| **Response 409** | `{ message: "user already exists" }` |

**Example request:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "s3cret"
}
```

**Example response:**
```json
{ "message": "success creating the user", "userId": 42 }
```

#### Login

| | |
|---|---|
| **Route** | `POST /user/login` |
| **Auth** | None |
| **Body** | `{ email, password }` |
| **Response 200** | `{ message: "loged in", token, role }` |
| **Response 401** | `{ message: "Invalid credintials" }` |

**Example response:**
```json
{ "message": "loged in", "token": "<JWT>", "role": "admin" }
```

#### Personal space

| | |
|---|---|
| **Route** | `GET /user/myspace` |
| **Auth** | Bearer JWT |
| **Response 200** | `{ user: { ... } }` or `{ user, message: "welcome Admin" }` for admins |

---

### Game endpoints — prefix `/api/games`

#### Get all games (admin)

| | |
|---|---|
| **Route** | `GET /api/games` |
| **Auth** | Bearer JWT + admin role |
| **Response 200** | `{ games: [ { id_partie, mode, type_partie, status, joueur_depart, joueur_gagnant, ligne_gagnante, signature, bga_table_id, board_size, created_at }, ... ] }` |

#### Get stats (admin)

| | |
|---|---|
| **Route** | `GET /api/games/stats` |
| **Auth** | Bearer JWT + admin role |
| **Response 200** | `{ totalGames, redWins, yellowWins, draws, avgMoves, colFrequency: number[] }` |

`colFrequency` is a 9-element array of percentage values (0–100) showing how often each column was played across all stored games.

**Example response:**
```json
{
  "totalGames": 1234,
  "redWins": 567,
  "yellowWins": 589,
  "draws": 78,
  "avgMoves": 36,
  "colFrequency": [8.2, 10.1, 14.0, 17.5, 16.3, 13.8, 11.2, 5.6, 3.3]
}
```

#### Get game by ID (admin)

| | |
|---|---|
| **Route** | `GET /api/games/:id` |
| **Auth** | Bearer JWT + admin role |
| **Response 200** | `{ game: { ... } }` |
| **Response 404** | `{ error: "Game not found" }` |

#### Create game (public)

| | |
|---|---|
| **Route** | `POST /api/games` |
| **Auth** | None (optional Bearer token) |
| **Body** | `{ signature, mode, type_partie?, status?, startingPlayer?, winner?, ligne_gagnante?, bga_table_id?, board_size? }` |
| **Response 201** | `{ message: "Game saved with success", game: { ... } }` |
| **Response 400** | `{ error: "signature is required..." }` |
| **Response 409** | `{ error, duplicateType: "original"\|"mirror"\|"bga_id", existingGame, mirrorSignature? }` |

**Example request:**
```json
{
  "signature": "3334445556",
  "mode": "normal",
  "type_partie": "BGA",
  "status": "finished",
  "startingPlayer": 1,
  "winner": 1,
  "ligne_gagnante": "[{\"row\":2,\"col\":3},{\"row\":2,\"col\":4},{\"row\":2,\"col\":5},{\"row\":2,\"col\":6}]",
  "bga_table_id": "12345678",
  "board_size": "7 columns, 6 rows"
}
```

**Example response:**
```json
{ "message": "Game saved with success", "game": { "id_partie": 99, "signature": "3334445556", ... } }
```

#### Delete game (admin)

| | |
|---|---|
| **Route** | `DELETE /api/games/:id` |
| **Auth** | Bearer JWT + admin role |
| **Response 200** | `{ message: "Game deleted" }` |

---

### Situation endpoint

#### Get situations for a game (admin)

| | |
|---|---|
| **Route** | `GET /api/games/:id/situations` |
| **Auth** | Bearer JWT + admin role |
| **Response 200** | `{ situations: [ { id_situation, id_partie, numero_coup, plateau, joueur, precedent, suivant }, ... ] }` |

`plateau` is a JSON-stringified 2D board snapshot. `joueur` is `'R'` or `'Y'`.

---

### BGA scraping endpoint

#### Scrape a BGA table

| | |
|---|---|
| **Route** | `GET /api/bga/:tableId` |
| **Auth** | None |
| **Param** | `tableId` — numeric BGA table ID |
| **Response 200** | `{ signature, status, starting_player, winning_player, winning_line, board_size }` |
| **Response 400** | `{ error: "Table ID invalide — doit être un nombre." }` |

> **Warning:** This endpoint launches a real Chrome browser process. It requires Chrome to be installed at `C:\Program Files\Google\Chrome\Application\chrome.exe` and a valid BGA session stored in the scrapper's `automation-profile`. The request can take 20–40 seconds.

**Example response:**
```json
{
  "signature": "33445562130",
  "status": "finished",
  "starting_player": "67890123",
  "winning_player": "67890123",
  "winning_line": [12, 19, 26, 33],
  "board_size": "7 columns, 6 rows"
}
```

---

### AI move suggestion endpoint

#### Suggest best move

| | |
|---|---|
| **Route** | `POST /api/suggest-move` |
| **Auth** | None |
| **Body** | `{ board: number[][], depth?: number, aiPlayer?: 1\|2 }` |
| **Response 200** | `{ bestCol: number, scores: (number\|null)[], bestScore: number }` |

- `depth` is clamped to [1, 10]. Default: `5`.
- `aiPlayer` defaults to `2` (Yellow). The engine maximises for this player.
- `scores` contains one score per column; `null` for full columns.

**Example request:**
```json
{
  "board": [
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0],
    [0,0,1,2,2,0,0]
  ],
  "depth": 5,
  "aiPlayer": 2
}
```

**Example response:**
```json
{ "bestCol": 3, "scores": [2, 4, 7, 15, 6, 3, 1], "bestScore": 15 }
```

---

### Probability endpoint

#### Get win probabilities

| | |
|---|---|
| **Route** | `POST /api/probability` |
| **Auth** | None |
| **Body** | `{ board: number[][], currentPlayer?: 1\|2, depth?: number }` |
| **Response 200** | `{ red: 0-100, yellow: 0-100, score: number, bestCol: number\|null, colScores: (number\|null)[] }` |

- `depth` is clamped to [1, 6]. Default: `4`.
- `red` and `yellow` always sum to 100.

**Example response:**
```json
{ "red": 62, "yellow": 38, "score": 14, "bestCol": 3, "colScores": [4, 6, 10, 14, 9, 5, 2] }
```

---

## 7. Game Engine

### Board representation

The board is a 2D integer array of shape `[rows][cols]` (default 6×7).

| Value | Meaning |
|---|---|
| `0` | Empty cell |
| `1` | Red player |
| `2` | Yellow player |

Rows are indexed top-to-bottom (row 0 is the top). Columns are indexed left-to-right. A piece is placed by scanning the column from `rows - 1` down to `0` and writing the player value into the first cell where `board[r][col] === 0`.

### Move validation

A column is **available** if `board[0][col] === 0` (top cell is empty). Full columns and out-of-range columns are rejected before any piece placement.

### Win detection

After every move, all four directions are checked from the placed cell:

| Direction | `[dr, dc]` |
|---|---|
| Horizontal | `[0, 1]` |
| Vertical | `[1, 0]` |
| Diagonal ↘ | `[1, 1]` |
| Diagonal ↗ | `[1, -1]` |

Each direction scans up to 3 cells in both directions from the placed cell, counting consecutive same-colour pieces. If total count ≥ 4, a win is detected. The winning four cells are stored in `winningCells` for highlighting.

In the backend and client minimax engines a full-board scan is used instead of the incremental approach (checking every possible window of 4).

### Evaluation function

The heuristic evaluates all windows of 4 consecutive cells (horizontal, vertical, both diagonals):

| Window composition | Score |
|---|---|
| 4 AI pieces | +100 |
| 3 AI + 1 empty | +5 |
| 2 AI + 2 empty | +2 |
| 3 opponent + 1 empty | −4 |

A centre-column bonus is also applied: +3 per AI piece in the centre column. This strongly encourages central control, which is a well-known Connect Four principle.

### Minimax algorithm

Both the frontend (`useMinimax.js`) and backend (`suggestController.js`, `probabilityController.js`) implement the same algorithm:

```
minimax(board, depth, isMaximising, alpha, beta, transpositionTable)

  if terminal(board):
    return heuristic score

  order columns by distance from centre (inner columns first)

  for each available column:
    place piece for current player
    if win: return WIN_SCORE ± depth  (depth bonus rewards faster wins)
    score = minimax(board, depth-1, !isMaximising, alpha, beta, TT)
    remove piece

    update alpha/beta
    if score >= WIN_SCORE: break early (forced win found)
    if beta <= alpha: break (alpha-beta cut-off)

  store result in TT
  return best score
```

**Optimisations:**

| Optimisation | Description |
|---|---|
| Alpha-beta pruning | Eliminates provably irrelevant branches |
| Transposition table | `Map<boardKey, score>` prevents re-evaluating identical positions |
| Centre-first column ordering | Better moves are explored first, improving cut-off rate |
| Forced-win early exit | If a winning move is found (`score >= WIN_SCORE`), search stops immediately |
| Depth-adjusted win scores | `WIN_SCORE + depth` rewards winning faster; opponent losing faster is rated higher |

**WIN_SCORE** is set to `9000` (backend) / `10000` (frontend) — safely above any heuristic score.

### Probability estimation

After the minimax search, the best column score is mapped to a 0–100 percentage via linear normalisation:

```
t = (clamp(score, -WIN_SCORE, WIN_SCORE) + WIN_SCORE) / (2 × WIN_SCORE)
probability = round(t × 100)
```

A score of `+WIN_SCORE` maps to 100% (certain win), `0` maps to 50% (equal position), `-WIN_SCORE` maps to 0%.

### Canonical signature and deduplication

Each game is encoded as a **signature**: a string of column indices in play order (e.g., `"3334456"`).

A Connect Four game played on a board with `N` columns has a **mirror image**: each column index `c` becomes `N + 1 - c`. The **canonical form** is `min(original, mirror)` (lexicographic). The database stores only the canonical form and rejects inserts where either the original or the mirror already exists.

---

## 8. Scrapper Documentation

The scrapper is a standalone Node.js project in `scrapper/`. It uses **Puppeteer** with the **Stealth plugin** to control a real Chrome browser and bypass BGA's bot-detection mechanisms.

### Two-step scraping workflow

#### Step 1 — Collect table URLs (`script.js`)

1. Launch Chrome with the persistent `automation-profile` (preserves BGA login).
2. Navigate to `https://boardgamearena.com/player?id=<playerId>`.
3. Click the "Last results" tab (`#pageheader_lastresults`).
4. Repeatedly scan `.post` elements, filter those with game name `"Connect Four"`, and extract table URLs and dates.
5. Click "See more" (`#board_seemore_r`) until no more results.
6. Write all URLs to `connect-four-results.json`.

#### Step 2 — Extract move sequences (`gameLogs.js`)

Reads `connect-four-results.json` and, for each table:

1. Skip if `scraped.json` already contains this table ID (resume support).
2. Navigate to `https://boardgamearena.com/table?table=<tableId>`.
3. Read the board size from `#mob_gameoption_100_displayed_value`.
4. Click "Review game" (`#reviewgame`) then choose a player to enter review mode.
5. Wait for `g_gamelogs` (the BGA JavaScript global) to be populated.
6. Extract moves from `g_gamelogs`: events of type `playDisc` contain the column index (`args.x`). The `won` event contains the winning player and winning cell indices.
7. Sort move events by `move_id` and join column indices into the signature string.
8. Save result to `data/game_<tableId>.json`.
9. Append `tableId` to `scraped.json`.
10. Write a per-game log to `logs/log_<tableId>.txt`.

#### Anti-bot measures

- **`antiBot.js`**: exports a `randomDelay()` that waits 8–12 seconds between operations (batch scraper).
- **`gameLogs.js`** uses an internal `randomDelay(min, max)` with per-click random delays of 200–700 ms.
- Human-like mouse movement (`page.mouse.move` with `steps: 12`) before clicks.
- Stealth plugin patches: hides `navigator.webdriver`, fakes Chrome runtime, and spoofs browser fingerprint.
- A custom `User-Agent` string matching a real Chrome version.
- The `--disable-blink-features=AutomationControlled` flag removes the most common automation signal.

#### One-time login helper (`oneTimeScrape.js`)

Opens `https://boardgamearena.com/` with the persistent profile and waits. The developer logs in manually in the browser window. When the window is closed, the session cookies are saved in `automation-profile/` for future use.

#### Scraped data format (`data/game_<id>.json`)

```json
{
  "signature": "3344556",
  "status": "finished",
  "starting_player": "94154229",
  "winning_player": "94154229",
  "winning_line": [12, 19, 26, 33],
  "board_size": "7 columns, 6 rows"
}
```

#### Bulk import into the database

`connect4_api/utils/importParties.js` reads all JSON files from the data directory and calls `gameService.saveGame` for each one, with deduplication.

Run:
```bash
cd connect4_api
npm run import
```

---

## 9. Database

### Database engine

**MySQL** (hosted on **TiDB Cloud**, EU Central region) accessed via the **Knex** query builder.

Connection details are defined in `knexfile.js` and rely on environment variables for sensitive fields in production.

### Schema

#### Table: `user`

| Column | Type | Constraints |
|---|---|---|
| `id_user` | INT (auto-increment) | PRIMARY KEY |
| `username` | VARCHAR(30) | NOT NULL |
| `email` | VARCHAR(50) | NOT NULL |
| `password` | VARCHAR(60) | NOT NULL (bcrypt hash) |
| `role` | ENUM('user','admin') | NOT NULL, DEFAULT 'user' |

#### Table: `partie`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id_partie` | INT (auto-increment) | PRIMARY KEY | |
| `mode` | VARCHAR(20) | NOT NULL | e.g. `'normal'` |
| `type_partie` | VARCHAR(20) | nullable | e.g. `'random'`, `'BGA'` |
| `status` | VARCHAR(20) | NOT NULL | `'finished'`, `'ongoing'` |
| `joueur_depart` | VARCHAR(1) | nullable | `'R'` or `'Y'` |
| `joueur_gagnant` | VARCHAR(1) | nullable | `'R'`, `'Y'`, or NULL (draw) |
| `ligne_gagnante` | TEXT | nullable | JSON array of `{row,col}` objects |
| `signature` | VARCHAR(255) | UNIQUE | Column-index move sequence |
| `bga_table_id` | VARCHAR(20) | nullable, UNIQUE | BGA table identifier |
| `board_size` | VARCHAR(10) | nullable, DEFAULT '7x6' | Board dimensions |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

#### Table: `situation`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id_situation` | INT (auto-increment) | PRIMARY KEY | |
| `id_partie` | INT | FK → `partie.id_partie` CASCADE DELETE | |
| `numero_coup` | INT | NOT NULL | Move number (1-based) |
| `plateau` | TEXT | NOT NULL | JSON-stringified 2D board snapshot |
| `joueur` | VARCHAR(1) | nullable | `'R'` or `'Y'` — who just played |
| `precedent` | INT | nullable | Previous situation ID |
| `suivant` | INT | nullable | Next situation ID |

### End-to-end data flow

```
BGA website
    │ Puppeteer scrape
    ▼
scrapper/data/game_<id>.json
    │ importParties.js  OR  POST /api/games (direct)
    ▼
partie table (signature, status, bga_table_id, …)
    │ generateSituation (on demand)
    ▼
situation table (plateau snapshots per move)
    │ GET /api/games  /  GET /api/games/stats
    ▼
Frontend DatabaseView (statistics, game list, replay)
```

---

## 10. Replay System

### How a replay is loaded

1. **From BGA**: `useBga.loadBgaGame()` calls `GET /api/bga/:tableId`, receives `signature` and `board_size`, calls `signatureToMoves(signature, rows, cols)` to convert column indices into `{ row, col, player }` objects, then calls `gameState.loadReplay(moves, startingPlayer)`.
2. **From the database**: `BgaView` fetches a stored game, extracts its `signature`, and calls `useBga.loadFromSignature(signature, startingPlayer)` which follows the same path.
3. **From a local file**: `useFileManagement.upload` restores `moveHistory` and `historyIndex` directly to the store.

### Board state reconstruction

`gameState.loadReplay` resets the board to all zeros and sets `historyIndex = -1`. The full move list is stored in `moveHistory` but the board is empty. The user steps forward with `redo()`:

```
redo():
  historyIndex++
  move = moveHistory[historyIndex]
  board[move.row][move.col] = move.player
  currentPlayer = move.player === 1 ? 2 : 1
```

`undo()` reverses:
```
undo():
  move = moveHistory[historyIndex]
  board[move.row][move.col] = 0      // remove piece
  currentPlayer = move.player        // restore player
  historyIndex--
  winner = null
  winningCells = []
```

### Winning line detection

Win checking (`useWinCheck.checkProbableWin`) is called after each move during live play and stores the four winning cell coordinates in `winningCells`. During replay, `winningCells` is cleared on every `undo` so the highlight disappears when stepping back past the winning move. It reappears when `redo` reaches the winning move again and `checkProbableWin` is called.

### Replay controls (`useReplay.js`)

| Control | Action |
|---|---|
| `startAutoReplay()` | Begins auto-play at `replaySpeed` ms/move (default 700 ms). Calling it again stops auto-play. |
| `stopAutoReplay()` | Clears the interval and sets `isReplaying = false`. |
| `stepForward()` | Single `redo()`. Stops auto-play if running. |
| `stepBackward()` | Single `undo()`. Stops auto-play if running. |
| `goToStart()` | Calls `undo()` in a loop until `historyIndex === -1`. |
| `goToEnd()` | Calls `redo()` in a loop until `historyIndex === moveHistory.length - 1`. |

---

## 11. AI Features

### Client-side AI (`useMinimax.js`)

The frontend minimax is used in two contexts:

1. **During gameplay**: when `isCurrentPlayerAI()` is true, `getBestMoveAsync` is called. It iterates columns one by one inside `setTimeout(0)` callbacks to yield control to the UI thread between column evaluations. A `progressCallback` is invoked after each column to update the AI thinking progress bar (0–100).

2. **On-demand suggestion**: the user can click a "Suggest move" button. The frontend calls the backend `POST /api/suggest-move` endpoint and displays the returned `bestCol` as a highlighted column on the board with a down-arrow indicator. Per-column scores are also shown below each column.

The client minimax assigns:
- `MAX_PLAYER = 2` (Yellow / AI)
- `MIN_PLAYER = 1` (Red / Human)

### Server-side AI (`suggestController.js`)

Stateless: receives the full board state and returns the best column. The `aiPlayer` parameter controls which player the engine maximises for (default: 2). Depth is capped at 10.

### Probability calculation (`probabilityController.js`)

Called from `useApi.fetchProbability(board, currentPlayer, depth)`. The frontend displays probability bars for Red and Yellow, updated after each move. The `bestCol` in the response can also be used to display the engine's preferred column.

### Evaluation function (shared logic)

| Heuristic component | Weight |
|---|---|
| Centre column piece for AI | +3 per piece |
| 4-in-a-row for AI | +100 |
| 3 AI + 1 empty | +5 |
| 2 AI + 2 empty | +2 |
| 3 opponent + 1 empty | −4 |
| Terminal win for AI | WIN_SCORE + depth |
| Terminal win for opponent | −(WIN_SCORE + depth) |

### Interaction with the UI

```
User clicks "Suggest Move"
        │
        ▼
useApi.fetchProbability(board, currentPlayer, depth=4)
        │
        ▼
POST /api/probability  ──→  probabilityController
        │                        │
        │                   minimax engine
        │                        │
        ◀── { red, yellow, bestCol, colScores }
        │
Board.vue: highlight suggestedCol, show colScores row
GameView.vue: show probability bars
```

---

## 12. Admin Dashboard

The admin dashboard is the `DatabaseView.vue` component. Access requires `role === 'admin'` stored in `localStorage`, and all API calls must include a valid admin JWT.

### Available statistics

| Statistic | Source |
|---|---|
| Total games | `stats.totalGames` |
| Red wins | `stats.redWins` (count where `joueur_gagnant = 'R'`) |
| Yellow wins | `stats.yellowWins` (count where `joueur_gagnant = 'Y'`) |
| Average moves | Mean of `LENGTH(signature)` across all games |
| Column frequency | Percentage breakdown of how often each column (0–8) was played |

The **column frequency bar chart** renders normalised bar heights in the UI, giving a visual heatmap of opening and mid-game column preferences across all stored games.

### Game list features

- Scrollable list of all stored games ordered by `created_at DESC`.
- Each row shows: game ID, type label, BGA table ID (if any), signature (truncated), move count, board size, winner colour dot.
- **Filter tabs**: All / Completed / Random / BGA.
- **View** button (👁): loads the game's signature into replay mode and navigates to BGA view.
- **Delete** button (🗑): calls `DELETE /api/games/:id` and removes the entry from the list.
- **Refresh** button: re-fetches both the stats and the game list.

### Data queries

| Query | Implementation |
|---|---|
| Total games + winner breakdown | `db('partie').count(...)` + `groupBy('joueur_gagnant')` |
| Average move count | Mean of `sig.length` computed in JavaScript after `db('partie').pluck('signature')` |
| Column frequency | Iterate all signatures, increment `colFreq[parseInt(ch)]` for each character |
| All games | `db('partie').select([...]).orderBy('created_at', 'desc')` |

---

## 13. Workflows

### Workflow 1: Playing a game

```
1. User opens HomeView → clicks "Nouvelle Partie"
2. NewGameSettingsModal opens
3. User selects game mode, board size, AI depth, starting player → clicks "Lancer"
4. gameSettings store is updated (setSettings)
5. gameState.resetGame() is called → empty board, player = startingPlayer
6. Router navigates to /game → GameView.vue
7. useGame.startGame() registers fillCol callback
   - If AI goes first → triggerAIMove → getBestMoveAsync → fillCol(bestCol)
8. Human clicks a column → fillCol(col)
   a. Validates availability
   b. Places piece (board[row][col] = player)
   c. Adds move to history
   d. Logs move to gameLogs
   e. checkProbableWin → if win: setWinner, setWinningCells, setGameStatus('finished')
   f. Toggles currentPlayer
   g. If next player is AI: triggerAIMove → AI computes → fillCol(aiCol)
9. Game ends → winner banner shown
10. User clicks "Sauvegarder" → useFileManagement.save() → localStorage
    OR clicks "Envoyer en base" → useApi.savedGameToDatabase() → POST /api/games
```

### Workflow 2: AI suggesting a move

```
1. During a game, user clicks "Suggestion IA" button in GameView sidebar
2. useApi.fetchProbability(board.value, currentPlayer.value, 4) is called
3. POST /api/probability sent to backend
4. Backend: probabilityController
   a. Clones board
   b. For each column: tries piece, runs minimax (depth 4), removes piece
   c. Best score → sigmoid → red%, yellow%
   d. Returns { red, yellow, bestCol, colScores }
5. Frontend:
   a. suggestedCol = bestCol → Board.vue highlights the column with ▼
   b. Probability bars updated in the sidebar
   c. colScores row shows score per column below the board
6. User clicks × to dismiss or plays a move (suggestedCol cleared)
```

### Workflow 3: Scraping a BGA game (batch)

```
1. Run: node oneTimeScrape.js → log in to BGA manually → close browser
2. Run: node script.js
   a. Opens BGA player profile page
   b. Clicks "Last results" tab
   c. Loops through pages, collects Connect Four table URLs
   d. Saves to connect-four-results.json
3. Run: node gameLogs.js
   a. Reads connect-four-results.json
   b. For each table not in scraped.json:
      i.  Navigate to table page
      ii. Read board size
      iii.Click "Review game" → choose player
      iv. Wait for g_gamelogs to populate
      v.  Extract playDisc events → build signature
      vi. Extract won event → winner, winning_line
      vii.Save data/game_<id>.json
      viii.Append to scraped.json
      ix. Write logs/log_<id>.txt
4. Run: cd connect4_api && npm run import
   a. importParties.js reads all data/*.json files
   b. Calls gameService.saveGame for each
   c. Deduplication check runs (bga_id + mirror signature)
   d. New games inserted into partie table
```

### Workflow 4: Saving a game to the database (from frontend)

```
1. Game finishes (winner set) → GameView shows "Envoyer en base" button
2. User clicks → useApi.savedGameToDatabase() called
3. Builds request body:
   - signature: getMoveSequenceFromMoveHistory() → "3344..." string
   - mode: 'normal'
   - type_partie: gameMode value
   - status: 'finished'
   - startingPlayer, winner, ligne_gagnante (JSON stringify of winningCells)
4. POST /api/games → gameController.create → gameService.saveGame
5. gameService:
   a. Convert player values (1 → 'R', 2 → 'Y')
   b. Check bga_table_id uniqueness (if provided)
   c. Check signature + mirror uniqueness
   d. gameModel.insertPartie → INSERT INTO partie
6. Response 201 → frontend shows success toast
   OR 409 → frontend shows "already exists" message
```

### Workflow 5: Viewing a replay

```
1. User opens BgaView
2a. [From BGA table ID]:
    User enters numeric table ID → clicks "Charger"
    useBga.loadBgaGame():
      GET /api/bga/:tableId → bgaController.scrapeTable()
      Puppeteer opens Chrome, navigates, extracts g_gamelogs
      Returns { signature, board_size, starting_player, ... }
    useBga: parse board_size → setBoardSize → signatureToMoves → gameState.loadReplay
    gameStatus = 'replay', historyIndex = -1, board = empty

2b. [From database]:
    User clicks "Actualiser" → useApi.fetchGames() → game list shown
    User clicks a game → useBga.loadFromSignature(game.signature, 1)
    Same path: signatureToMoves → gameState.loadReplay

3. Replay controls appear:
   - ⏮ goToStart  ◀ stepBackward  ▶/⏸ auto-play  ▶ stepForward  ⏭ goToEnd
   - Speed slider (replaySpeed in ms)

4. Each stepForward calls gameState.redo():
   - historyIndex++
   - board[row][col] = player
   - currentPlayer toggles
   - If last move was winning: checkProbableWin highlights winningCells

5. Each stepBackward calls gameState.undo():
   - board[row][col] = 0
   - winningCells = []
   - historyIndex--

6. User can save the viewed game: "Sauvegarder en base" → POST /api/games
```

---

## 14. Setup and Development

### Prerequisites

| Requirement | Notes |
|---|---|
| Node.js ≥ 18 | All three projects require Node.js |
| Google Chrome | Required by the scrapper and the backend BGA endpoint. Must be installed at `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| MySQL database | TiDB Cloud account (or local MySQL). Update `knexfile.js` accordingly |
| BGA account | Required to scrape games. Log in via `oneTimeScrape.js` |

### Install dependencies

```bash
# Frontend
cd connect4
npm install

# Backend
cd connect4_api
npm install

# Scrapper
cd scrapper
npm install
```

### Environment variables (backend)

Create `connect4_api/.env`:

```env
SECRET=your_jwt_secret_key_here
PORT=3000
```

> The database connection is currently hard-coded in `knexfile.js`. Move credentials to `.env` before deploying to production.

### Run the backend

```bash
cd connect4_api

# Development (auto-reload with nodemon)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`.

### Run the frontend

```bash
cd connect4
npm run dev
```

Vite serves the app at `http://localhost:5173` by default.

> The frontend's `useApi.js` points to `https://connect4-backend-xodq.onrender.com/api` (production). Change the `API_URL` constant to `http://localhost:3000/api` for local development.  
> The `useBga.js` composable already uses `http://localhost:3000`.

### Run the scrapper

```bash
cd scrapper

# Step 0: log in to BGA manually (first time only)
node oneTimeScrape.js

# Step 1: collect table URLs
node script.js

# Step 2: scrape each game
node gameLogs.js
```

### Run database migrations

```bash
cd connect4_api
npx knex migrate:latest
```

### Bulk-import scraped games

```bash
cd connect4_api
npm run import
```

### Build the frontend for production

```bash
cd connect4
npm run build
# Output: connect4/dist/
```

---

## 15. Contribution Guide

### Adding a new API endpoint

1. Create or update a **controller** file in `connect4_api/controllers/`.
2. Add the corresponding **route** file in `connect4_api/routes/` (or add to an existing one).
3. Register the route in `connect4_api/server.js`:
   ```js
   const myRoutes = require('./routes/myRoutes');
   app.use('/api/my-resource', myRoutes);
   ```
4. Apply `auth` and/or `isAdmin` middleware as appropriate.
5. Update the [API Endpoints](#6-api-endpoints) section of this README.

### Adding a new frontend feature

1. If the feature requires shared state, extend the appropriate **Pinia store** (`gameState.js` or `gameSettings.js`), or create a new store.
2. Encapsulate logic in a **composable** under `src/composables/`. Follow the `useXxx()` naming convention and return only the functions and refs that consumers need.
3. If a new view is required, create it under `src/views/` and register it in `src/routers/index.js`.
4. If backend communication is required, add the fetch call to `useApi.js` and expose it via the composable return value.
5. Use **Tailwind CSS** utility classes for styling. Keep component styles scoped or rely fully on utility classes.

### Extending the engine

Both the frontend (`useMinimax.js`) and backend (`suggestController.js`, `probabilityController.js`) minimax engines share the same algorithmic structure but are independent implementations. When making changes to the evaluation logic:

- Update **both** implementations to keep behaviour consistent.
- The `scoreWindow` / `evaluateWindow` function is the single most impactful place to modify the heuristic.
- Increase `WIN_SCORE` only if you also increase heuristic piece-count scores proportionally, to avoid heuristic scores exceeding the win threshold.
- Increasing `aiDepth` beyond 7–8 will cause noticeable response-time degradation on a 7×7 board. Use the `colScores` output in tests to validate that the engine prefers known strong moves.

### Maintaining compatibility

- **Signature format**: the signature string is the primary key for game deduplication. Any change to how column indices are encoded (e.g. switching from 0-indexed to 1-indexed) will break deduplication for existing records. Do not change this without a migration.
- **Board encoding**: the 2D array convention (`0/1/2`, rows top-to-bottom) is used in every part of the system. Changing it requires updating the minimax engines, win checker, situation generator, and the BGA signature parser simultaneously.
- **JWT payload**: the token contains `{ id, role }`. Adding fields requires updating `userController.login` and any middleware that reads `req.user`.
- **Database migrations**: always write both `up` and `down` functions. Run `npx knex migrate:rollback` to test rollback before merging.
