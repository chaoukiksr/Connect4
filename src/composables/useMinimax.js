// src/composables/useMinimax.js
// Minimax — fully rewritten for maximum strength and efficiency.
//
// Improvements over previous version:
//  1. Undo-move pattern          — eliminates all board copies (was O(42) allocs/node)
//  2. Incremental win detection  — O(12 cells) vs O(234) full-board scan per node
//  3. Iterative deepening (ID)   — hard 2-second budget; deepens until time runs out
//  4. Proper transposition table — key = board only (no depth), stores {score,depth,flag,bestMove}
//                                   → depth-gated reuse: a cached result at depth 6 is reused at ≤6
//  5. TT-guided move ordering    — prior-iteration best move is tried first at each node
//  6. Killer move heuristic      — β-cutoff moves stored per depth, tried first next call
//  7. 1-ply pre-checks           — immediate win and forced-block detected in O(7) before full search
//  8. Stronger heuristic         — blocking weight (-90) > attack weight (+50),
//                                   column positional weights [3,4,5,7,5,4,3],
//                                   no temporary array allocations in hot path
//  9. Fixed forEach early-exit   — getBestMove now uses for-of with break

export function useMinimax() {
  const MAX_PLAYER = 2;   // AI
  const MIN_PLAYER = 1;   // Human
  const EMPTY      = 0;

  const WIN       = 10_000_000;        // terminal win score
  const WIN_CLAMP = WIN / 2;           // any score ≥ this = forced win line

  // TT entry flags (for alpha-beta bound type)
  const F_EXACT = 0;   // exact minimax value
  const F_LOWER = 1;   // beta-cutoff:  stored score is a lower bound  (real score ≥ stored)
  const F_UPPER = 2;   // alpha-cutoff: stored score is an upper bound (real score ≤ stored)

  // Positional column weights — standard 7-column board.
  // Column 3 (center) is most valuable; edges are least.
  const COL_WEIGHTS_7 = [3, 4, 5, 7, 5, 4, 3];

  // ─── Board mutation helpers (no copies) ────────────────────────────────────

  /** Drop player's piece into col. Returns the landing row, or -1 if column full. */
  const drop = (board, col, player, rows) => {
    for (let r = rows - 1; r >= 0; r--) {
      if (board[r][col] === EMPTY) { board[r][col] = player; return r; }
    }
    return -1;
  };

  /** Undo a drop. */
  const undo = (board, row, col) => { board[row][col] = EMPTY; };

  // ─── Incremental win detection ─────────────────────────────────────────────

  /**
   * Check whether placing player's piece at (row, col) completed 4-in-a-row.
   * Examines at most 12 cells — O(1) compared to O(234) for a full-board scan.
   */
  const hasWon = (board, row, col, player, rows, cols) => {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of dirs) {
      let n = 1;
      for (let s = 1; s < 4; s++) {
        const r = row + dr * s, c = col + dc * s;
        if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== player) break;
        n++;
      }
      for (let s = 1; s < 4; s++) {
        const r = row - dr * s, c = col - dc * s;
        if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== player) break;
        n++;
      }
      if (n >= 4) return true;
    }
    return false;
  };

  // ─── Move ordering ─────────────────────────────────────────────────────────

  /**
   * Returns available column indices with priority ordering:
   *   1st — TT best move from previous depth (highest priority)
   *   2nd — Killer move (caused β-cutoff at same depth before)
   *   3rd — Center-distance ordering (center columns tried first)
   */
  const getOrderedMoves = (board, cols, ttBestMove, killer) => {
    const center = Math.floor(cols / 2);
    const moves = [];
    for (let c = 0; c < cols; c++) {
      if (board[0][c] === EMPTY) moves.push(c);
    }
    // Sort by center distance (ascending = center first)
    moves.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

    // Promote killer move ahead of center order
    if (killer !== null && killer !== undefined) {
      const ki = moves.indexOf(killer);
      if (ki > 0) { moves.splice(ki, 1); moves.unshift(killer); }
    }
    // Promote TT best move to absolute front
    if (ttBestMove !== null && ttBestMove !== undefined) {
      const ti = moves.indexOf(ttBestMove);
      if (ti > 0) { moves.splice(ti, 1); moves.unshift(ttBestMove); }
    }
    return moves;
  };

  // ─── Heuristic evaluation ──────────────────────────────────────────────────

  /**
   * Score one 4-cell window inline — zero temporary arrays, zero object creation.
   * Positive score = good for MAX_PLAYER; negative = good for MIN_PLAYER.
   *
   * Blocking weight (-90) is intentionally larger than attack weight (+50):
   * the AI must prioritise preventing losses over building threats.
   */
  const scoreWindow = (a, b, c, d) => {
    let pc = 0, oc = 0, ec = 0;
    if (a === MAX_PLAYER) pc++; else if (a === MIN_PLAYER) oc++; else ec++;
    if (b === MAX_PLAYER) pc++; else if (b === MIN_PLAYER) oc++; else ec++;
    if (c === MAX_PLAYER) pc++; else if (c === MIN_PLAYER) oc++; else ec++;
    if (d === MAX_PLAYER) pc++; else if (d === MIN_PLAYER) oc++; else ec++;

    if (pc > 0 && oc > 0) return 0;  // mixed window — neither side can complete it

    // MAX threats (attack)
    if (pc === 4) return  2000;        // safety net — should be caught by hasWon first
    if (pc === 3 && ec === 1) return    50;
    if (pc === 2 && ec === 2) return    10;

    // MIN threats (block — weighted higher to prioritise defence)
    if (oc === 4) return -2000;
    if (oc === 3 && ec === 1) return   -90;
    if (oc === 2 && ec === 2) return   -15;

    return 0;
  };

  /**
   * Full heuristic board evaluation (from MAX_PLAYER's perspective).
   * Scans all 4-cell windows + positional column bonus.
   */
  const evaluate = (board, rows, cols) => {
    let score = 0;

    // Column positional bonus/penalty
    const cw = cols === 7
      ? COL_WEIGHTS_7
      : Array.from({ length: cols }, (_, i) => Math.max(7 - Math.abs(i - Math.floor(cols / 2)) * 2, 1));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = board[r][c];
        if      (v === MAX_PLAYER) score += cw[c];
        else if (v === MIN_PLAYER) score -= cw[c];
      }
    }

    // Horizontal windows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        score += scoreWindow(board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]);
      }
    }
    // Vertical windows
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r <= rows - 4; r++) {
        score += scoreWindow(board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]);
      }
    }
    // Diagonal ↘
    for (let r = 0; r <= rows - 4; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        score += scoreWindow(board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]);
      }
    }
    // Diagonal ↗
    for (let r = 3; r < rows; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        score += scoreWindow(board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]);
      }
    }

    return score;
  };

  // ─── Transposition table key ───────────────────────────────────────────────

  /**
   * Board → compact string key.
   * Depth and isMaximizing are NOT included in the key so that the same
   * board position evaluated at depth 6 can be reused at any depth ≤ 6.
   */
  const boardKey = (board) => {
    let k = '';
    for (let r = 0; r < board.length; r++) {
      const row = board[r];
      for (let c = 0; c < row.length; c++) k += row[c];
      k += '|';
    }
    return k;
  };

  // ─── Core minimax ──────────────────────────────────────────────────────────

  /**
   * Recursive alpha-beta minimax.
   *
   * Features:
   *  - Transposition table with exact / lower / upper bounds and depth gating
   *  - Killer move heuristic (updates killers[depth] on beta cutoff)
   *  - TT-guided move ordering (best move from previous depth tried first)
   *  - Undo-move pattern (board mutated in-place, no copies)
   *  - Incremental win detection via hasWon()
   *  - Hard deadline: returns 0 if time expired (ID loop discards tainted depth)
   *
   * @param {number[][]} board    — mutable; caller must not touch during recursion
   * @param {number}     depth    — remaining plies to search
   * @param {boolean}    isMax    — true when MAX_PLAYER is to move
   * @param {number}     alpha
   * @param {number}     beta
   * @param {number}     rows
   * @param {number}     cols
   * @param {Map}        tt       — transposition table (shared across the full search)
   * @param {number[]}   killers  — killers[depth] = column that last caused a β-cutoff
   * @param {number}     deadline — Date.now() value at which search must stop
   * @param {{v:boolean}} aborted — shared flag; set to true on first timeout so callers
   *                                can detect a tainted subtree and skip TT writes.
   * @returns {number} score from MAX_PLAYER's perspective
   */
  const _minimax = (board, depth, isMax, alpha, beta, rows, cols, tt, killers, deadline, aborted) => {
    // Time guard — mark the whole subtree as tainted so callers skip TT stores
    if (aborted.v || Date.now() >= deadline) { aborted.v = true; return 0; }

    // ── Transposition table lookup ─────────────────────────────────────────
    const key = boardKey(board);
    const entry = tt.get(key);
    if (entry && entry.depth >= depth) {
      if (entry.flag === F_EXACT) return entry.score;
      if (entry.flag === F_LOWER) alpha = Math.max(alpha, entry.score);
      else if (entry.flag === F_UPPER) beta = Math.min(beta, entry.score);
      if (alpha >= beta) return entry.score;
    }

    // ── Leaf node ─────────────────────────────────────────────────────────
    if (depth === 0) {
      const s = evaluate(board, rows, cols);
      // Store as exact — depth 0 is always exact
      if (!entry || entry.depth < 0) tt.set(key, { score: s, depth: 0, flag: F_EXACT, bestMove: null });
      return s;
    }

    // ── Move generation ───────────────────────────────────────────────────
    const moves = getOrderedMoves(board, cols, entry?.bestMove ?? null, killers[depth] ?? null);
    if (moves.length === 0) {
      // Board full — draw
      tt.set(key, { score: 0, depth, flag: F_EXACT, bestMove: null });
      return 0;
    }

    const origAlpha = alpha;
    let bestScore = isMax ? -(WIN + 1) : (WIN + 1);
    let bestMove  = moves[0];
    const player  = isMax ? MAX_PLAYER : MIN_PLAYER;

    // ── Search loop ───────────────────────────────────────────────────────
    for (const col of moves) {
      const row = drop(board, col, player, rows);
      if (row === -1) continue;

      let score;
      if (hasWon(board, row, col, player, rows, cols)) {
        // Prefer faster wins: higher remaining depth = win found sooner from root
        score = isMax ? WIN + depth : -(WIN + depth);
      } else {
        score = _minimax(board, depth - 1, !isMax, alpha, beta, rows, cols, tt, killers, deadline, aborted);
      }
      undo(board, row, col);

      // If a child timed out, its score is meaningless — abandon this node too
      if (aborted.v) break;

      if (isMax) {
        if (score > bestScore) { bestScore = score; bestMove = col; }
        if (bestScore > alpha) alpha = bestScore;
      } else {
        if (score < bestScore) { bestScore = score; bestMove = col; }
        if (bestScore < beta)  beta  = bestScore;
      }

      if (alpha >= beta) {
        killers[depth] = col;  // remember this cutoff move for sibling nodes
        break;
      }
    }

    // ── TT store ──────────────────────────────────────────────────────────
    // Skip TT write if the search was aborted — the score is tainted by a
    // timeout-zero from a child and would pollute future lookups.
    if (!aborted.v) {
      let flag;
      if      (bestScore <= origAlpha) flag = F_UPPER;   // failed-low  (real ≤ bestScore)
      else if (bestScore >= beta)      flag = F_LOWER;   // failed-high (real ≥ bestScore)
      else                             flag = F_EXACT;

      const prev = tt.get(key);
      if (!prev || prev.depth <= depth) {
        tt.set(key, { score: bestScore, depth, flag, bestMove });
      }
    }

    return bestScore;
  };

  // ─── Root search with iterative deepening ─────────────────────────────────

  /**
   * Find the best column to play (async, with UI progress).
   *
   * Strategy:
   *  1. Immediately return if there is a 1-ply winning move.
   *  2. Immediately flag a 1-ply must-block if the opponent would win next turn.
   *  3. Run iterative deepening from depth 1 up to maxDepth (or until 2 s elapsed).
   *     Each completed depth overwrites the previous best move.
   *     A depth that runs out of time is discarded (previous depth kept).
   *
   * @param {number[][]} board
   * @param {number}     maxDepth  — maximum search depth (cap; time may stop earlier)
   * @param {Function}   onProgress — optional callback(0-100)
   * @returns {Promise<number|null>} best column index
   */
  const getBestMoveAsync = async (board, maxDepth = 7, onProgress = null) => {
    const rows = board.length;
    const cols = board[0].length;
    const TIME_MS  = 2000;
    const deadline = Date.now() + TIME_MS;
    const tt       = new Map();
    const killers  = new Array(maxDepth + 4).fill(null);

    // Build initial move list (center-first)
    const center = Math.floor(cols / 2);
    const allMoves = [];
    for (let c = 0; c < cols; c++) if (board[0][c] === EMPTY) allMoves.push(c);
    allMoves.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

    if (allMoves.length === 0) return null;

    const immediateWinningCols = (player) => {
      const wins = [];
      for (const col of allMoves) {
        const row = drop(board, col, player, rows);
        if (row === -1) continue;
        const win = hasWon(board, row, col, player, rows, cols);
        undo(board, row, col);
        if (win) wins.push(col);
      }
      return wins;
    };

    // ── 1-ply: take immediate win ────────────────────────────────────────
    const winningNow = immediateWinningCols(MAX_PLAYER);
    if (winningNow.length > 0) {
      if (onProgress) onProgress(100);
      return winningNow[0];
    }

    // ── Forced defense: only explore moves that remove all immediate losses ─
    const oppWinsNow = immediateWinningCols(MIN_PLAYER);
    let forcedMoves = [...allMoves];
    if (oppWinsNow.length > 0) {
      const blockers = allMoves.filter((col) => {
        const row = drop(board, col, MAX_PLAYER, rows);
        if (row === -1) return false;
        const oppWinsAfter = immediateWinningCols(MIN_PLAYER);
        undo(board, row, col);
        return oppWinsAfter.length === 0;
      });

      if (blockers.length === 1) {
        if (onProgress) onProgress(100);
        return blockers[0];
      }

      if (blockers.length > 0) {
        forcedMoves = blockers;
      }
    }

    // ── Iterative deepening ──────────────────────────────────────────────
    let bestMove  = forcedMoves[0] ?? allMoves[0];
    let bestScore = -(WIN + 1);

    for (let depth = 1; depth <= maxDepth; depth++) {
      if (Date.now() >= deadline) break;

      let iterBest  = -(WIN + 1);
      let iterMove  = null;
      let alpha     = -(WIN + 1);
      const beta    = WIN + 1;
      let timedOut  = false;
      const aborted = { v: false };

      // At each depth, put the must-block column first
      const iterMoves = [...forcedMoves];

      for (const col of iterMoves) {
        if (Date.now() >= deadline) { timedOut = true; break; }

        const row = drop(board, col, MAX_PLAYER, rows);
        if (row === -1) continue;

        let score;
        if (hasWon(board, row, col, MAX_PLAYER, rows, cols)) {
          score = WIN + depth;
        } else {
          score = _minimax(board, depth - 1, false, alpha, beta, rows, cols, tt, killers, deadline, aborted);
        }
        undo(board, row, col);

        // _minimax timed out internally — score is tainted, discard this depth
        if (aborted.v) { timedOut = true; break; }

        if (score > iterBest) { iterBest = score; iterMove = col; }
        if (iterBest > alpha) alpha = iterBest;
        if (iterBest >= WIN_CLAMP) break;  // forced win found — no need to check other columns
      }

      // Only commit this depth if it completed without running out of time
      if (!timedOut && iterMove !== null) {
        bestMove  = iterMove;
        bestScore = iterBest;
      }

      if (onProgress) onProgress(Math.round((depth / maxDepth) * 90));
      if (bestScore >= WIN_CLAMP) break;  // forced win — deeper search won't change the move

      // Yield to keep UI responsive between depth iterations
      await new Promise(r => setTimeout(r, 0));
    }

    if (onProgress) onProgress(100);
    const elapsed = Math.min(TIME_MS, TIME_MS - (deadline - Date.now()));
    console.log(`[Minimax] score=${bestScore} col=${bestMove} tt=${tt.size} time≈${elapsed}ms`);
    return bestMove;
  };

  /**
   * Synchronous version of getBestMoveAsync (used in non-UI contexts).
   * Same iterative deepening logic, no await.
   */
  const getBestMove = (board, maxDepth = 7, onProgress = null) => {
    const rows = board.length;
    const cols = board[0].length;
    const TIME_MS  = 2000;
    const deadline = Date.now() + TIME_MS;
    const tt       = new Map();
    const killers  = new Array(maxDepth + 4).fill(null);

    const center = Math.floor(cols / 2);
    const allMoves = [];
    for (let c = 0; c < cols; c++) if (board[0][c] === EMPTY) allMoves.push(c);
    allMoves.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

    if (allMoves.length === 0) return null;

    const immediateWinningCols = (player) => {
      const wins = [];
      for (const col of allMoves) {
        const row = drop(board, col, player, rows);
        if (row === -1) continue;
        const win = hasWon(board, row, col, player, rows, cols);
        undo(board, row, col);
        if (win) wins.push(col);
      }
      return wins;
    };

    // 1-ply win
    const winningNow = immediateWinningCols(MAX_PLAYER);
    if (winningNow.length > 0) {
      if (onProgress) onProgress(100);
      return winningNow[0];
    }

    // Forced defense
    const oppWinsNow = immediateWinningCols(MIN_PLAYER);
    let forcedMoves = [...allMoves];
    if (oppWinsNow.length > 0) {
      const blockers = allMoves.filter((col) => {
        const row = drop(board, col, MAX_PLAYER, rows);
        if (row === -1) return false;
        const oppWinsAfter = immediateWinningCols(MIN_PLAYER);
        undo(board, row, col);
        return oppWinsAfter.length === 0;
      });

      if (blockers.length === 1) {
        if (onProgress) onProgress(100);
        return blockers[0];
      }

      if (blockers.length > 0) {
        forcedMoves = blockers;
      }
    }

    let bestMove  = forcedMoves[0] ?? allMoves[0];
    let bestScore = -(WIN + 1);

    for (let depth = 1; depth <= maxDepth; depth++) {
      if (Date.now() >= deadline) break;

      let iterBest = -(WIN + 1);
      let iterMove = null;
      let alpha    = -(WIN + 1);
      const beta   = WIN + 1;
      let timedOut = false;
      const aborted = { v: false };

      const iterMoves = [...forcedMoves];

      for (const col of iterMoves) {
        if (Date.now() >= deadline) { timedOut = true; break; }

        const row = drop(board, col, MAX_PLAYER, rows);
        if (row === -1) continue;

        let score;
        if (hasWon(board, row, col, MAX_PLAYER, rows, cols)) {
          score = WIN + depth;
        } else {
          score = _minimax(board, depth - 1, false, alpha, beta, rows, cols, tt, killers, deadline, aborted);
        }
        undo(board, row, col);

        if (aborted.v) { timedOut = true; break; }

        if (score > iterBest) { iterBest = score; iterMove = col; }
        if (iterBest > alpha) alpha = iterBest;
        if (iterBest >= WIN_CLAMP) break;
      }

      if (!timedOut && iterMove !== null) {
        bestMove  = iterMove;
        bestScore = iterBest;
      }

      if (onProgress) onProgress(Math.round((depth / maxDepth) * 90));
      if (bestScore >= WIN_CLAMP) break;
    }

    if (onProgress) onProgress(100);
    return bestMove;
  };

  // ─── Column score helpers (for score overlay display) ─────────────────────

  /**
   * Single-pass analysis: returns { bestCol, scores[], bestScore }.
   * Used by the "IA jouerait" suggestion button.
   * Shares the TT and accumulates alpha across columns (standard alpha-beta root):
   * non-best columns may get lower-bound estimates rather than exact scores,
   * but the best column and its score are always accurate.
   */
  const analyseAsync = async (board, depth = 5, onProgress = null) => {
    const rows = board.length;
    const cols = board[0].length;
    const deadline = Date.now() + 1500;
    const tt      = new Map();
    const killers = new Array(depth + 4).fill(null);
    const scores  = Array(cols).fill(null);
    const aborted = { v: false };

    const center = Math.floor(cols / 2);
    const avail = [];
    for (let c = 0; c < cols; c++) if (board[0][c] === EMPTY) avail.push(c);
    avail.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

    let bestScore = -(WIN + 1);
    let bestCol   = null;
    let alpha     = -(WIN + 1);

    for (let i = 0; i < avail.length; i++) {
      const col = avail[i];
      const row = drop(board, col, MAX_PLAYER, rows);
      if (row === -1) { continue; }

      let s;
      if (hasWon(board, row, col, MAX_PLAYER, rows, cols)) {
        s = WIN + depth;
      } else {
        s = _minimax(board, depth - 1, false, alpha, WIN + 1, rows, cols, tt, killers, deadline, aborted);
      }
      undo(board, row, col);

      // If the search timed out internally, remaining scores are unreliable
      if (aborted.v) break;

      scores[col] = s;
      if (s > bestScore) { bestScore = s; bestCol = col; }
      alpha = Math.max(alpha, s);

      if (onProgress) {
        onProgress(Math.round(((i + 1) / avail.length) * 100));
        await new Promise(r => setTimeout(r, 0));
      }
      if (bestScore >= WIN_CLAMP) {
        if (onProgress) onProgress(100);
        break;
      }
    }

    return { bestCol, scores, bestScore };
  };

  /** Synchronous column score computation (capped at depth for display speed).
   *  @param {1|2} player — whose turn it is; scores are always from MAX_PLAYER perspective.
   */
  const getColumnScores = (board, depth = 5, player = MAX_PLAYER) => {
    const rows = board.length;
    const cols = board[0].length;
    const deadline = Date.now() + 1000;
    const tt      = new Map();
    const killers = new Array(depth + 4).fill(null);
    const aborted = { v: false };
    const scores  = [];

    for (let col = 0; col < cols; col++) {
      if (board[0][col] !== EMPTY) { scores.push(null); continue; }
      const row = drop(board, col, player, rows);
      let s;
      if (hasWon(board, row, col, player, rows, cols)) {
        // Immediate win: positive for AI, negative for human
        s = player === MAX_PLAYER ? WIN + depth : -(WIN + depth);
      } else {
        const isMaxNext = (player === MIN_PLAYER); // after player drops, the other player moves
        s = _minimax(board, depth - 1, isMaxNext, -(WIN + 1), WIN + 1, rows, cols, tt, killers, deadline, aborted);
      }
      undo(board, row, col);
      if (aborted.v) { scores.push(null); break; } // remaining columns are null-filled below
      scores.push(s);
    }
    // Pad with nulls if we bailed early due to timeout
    while (scores.length < cols) scores.push(null);
    return scores;
  };

  /** Async version of getColumnScores — yields between columns to keep UI responsive.
   *  @param {number} player  - the player whose move is being evaluated (1=human, 2=AI)
   *  Scores are always expressed from MAX_PLAYER (AI=2) perspective:
   *    positive = good for AI, negative = good for human.
   */
  const getColumnScoresAsync = async (board, depth = 5, player = MAX_PLAYER) => {
    const rows = board.length;
    const cols = board[0].length;
    const deadline = Date.now() + 1500;
    const tt      = new Map();
    const killers = new Array(depth + 4).fill(null);
    const aborted = { v: false };
    const scores  = [];

    for (let col = 0; col < cols; col++) {
      if (board[0][col] !== EMPTY) { scores.push(null); continue; }
      const row = drop(board, col, player, rows);
      let s;
      if (hasWon(board, row, col, player, rows, cols)) {
        // Immediate win: positive for AI, negative for human
        s = player === MAX_PLAYER ? WIN + depth : -(WIN + depth);
      } else {
        // After player drops, the OTHER player moves next
        const isMaxNext = (player === MIN_PLAYER);
        s = _minimax(board, depth - 1, isMaxNext, -(WIN + 1), WIN + 1, rows, cols, tt, killers, deadline, aborted);
      }
      undo(board, row, col);
      if (aborted.v) { scores.push(null); break; } // remaining columns stay null
      scores.push(s);
      if (col % 2 === 0) await new Promise(r => setTimeout(r, 0));
    }
    // Pad with nulls if we bailed early due to timeout
    while (scores.length < cols) scores.push(null);
    return scores;
  };

  /**
   * Converts a minimax score to a prediction label from the given player's perspective.
   * Scores are always from MAX_PLAYER (AI=2) perspective internally.
   *
   * @param {number|null} score        - minimax score (null = column full / invalid)
   * @param {1|2}         currentPlayer - whose turn it is (1=human, 2=AI)
   * @returns {'Victoire'|'Defaite'|'Nul'|'Incertain'|null}
   */
  const scoreToLabel = (score, currentPlayer = MAX_PLAYER) => {
    if (score === null) return null;
    if (currentPlayer === MAX_PLAYER) {
      // AI's turn: positive score = AI winning
      if (score >= WIN_CLAMP)  return 'Victoire';
      if (score <= -WIN_CLAMP) return 'Defaite';
      if (score === 0)         return 'Nul';
      return 'Incertain';
    } else {
      // Human's turn: high AI score after human plays = bad for human
      if (score <= -WIN_CLAMP) return 'Victoire';
      if (score >= WIN_CLAMP)  return 'Defaite';
      if (score === 0)         return 'Nul';
      return 'Incertain';
    }
  };

  // ─── Game outcome predictor ───────────────────────────────────────────────

  /**
   * Predicts the game outcome from the current board position.
   *
   * Uses iterative deepening minimax (up to 5-second budget) for either player.
   * The WIN score encoding (WIN + remaining_depth) lets us recover the exact
   * number of moves to forced win: movesCount = searchDepth - (|score| - WIN) + 1.
   *
   * @param {number[][]} board    — plain array snapshot (NOT the reactive store ref)
   * @param {1|2}        player   — whose turn it is (1=Rouge, 2=Jaune/AI)
   * @param {Function}  [onProgress] — optional callback(0–100)
   * @returns {Promise<{
   *   winner:     1|2|0|null,   // 1=Rouge, 2=Jaune, 0=draw, null=unknown
   *   movesCount: number|null,  // moves until forced outcome (null if not confident)
   *   confident:  boolean,      // true = forced by perfect play
   *   depth:      number        // last completed search depth
   * }>}
   */
  const predictAsync = async (board, player = MAX_PLAYER, onProgress = null) => {
    const rows = board.length;
    const cols = board[0].length;

    // Count playable cells (upper bound on remaining moves)
    let emptyCells = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (board[r][c] === EMPTY) emptyCells++;

    if (emptyCells === 0) return { winner: 0, movesCount: 0, confident: true, depth: 0 };

    const maxDepth = Math.min(emptyCells, 25);
    const TIME_MS  = 5000;
    const deadline = Date.now() + TIME_MS;
    const tt       = new Map();
    const killers  = new Array(maxDepth + 4).fill(null);

    const center   = Math.floor(cols / 2);
    const allMoves = [];
    for (let c = 0; c < cols; c++) if (board[0][c] === EMPTY) allMoves.push(c);
    allMoves.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

    // ── 1-ply: immediate win for current player ──────────────────────────
    for (const col of allMoves) {
      const row = drop(board, col, player, rows);
      if (row !== -1) {
        if (hasWon(board, row, col, player, rows, cols)) {
          undo(board, row, col);
          return { winner: player, movesCount: 1, confident: true, depth: 1 };
        }
        undo(board, row, col);
      }
    }

    let bestScore          = 0;   // safe neutral; only used if lastCompletedDepth stays 0
    let lastCompletedDepth = 0;

    // ── Iterative deepening ───────────────────────────────────────────────
    for (let depth = 1; depth <= maxDepth; depth++) {
      if (Date.now() >= deadline) break;

      // Sentinel must be strictly beyond any reachable WIN+d score at this depth.
      // WIN+depth is the largest win score possible at this search depth (immediate
      // win at root). Using WIN+depth+1 guarantees any real score will update iterBest.
      let iterBest = player === MAX_PLAYER ? -(WIN + depth + 1) : (WIN + depth + 1);
      let alpha    = -(WIN + 1);
      let beta     =   WIN + 1;
      let timedOut = false;
      const aborted = { v: false };

      for (const col of allMoves) {
        if (Date.now() >= deadline) { timedOut = true; break; }

        const row = drop(board, col, player, rows);
        if (row === -1) continue;

        let s;
        if (hasWon(board, row, col, player, rows, cols)) {
          s = player === MAX_PLAYER ? WIN + depth : -(WIN + depth);
        } else {
          const isMaxNext = (player === MIN_PLAYER);
          s = _minimax(board, depth - 1, isMaxNext, alpha, beta, rows, cols, tt, killers, deadline, aborted);
        }
        undo(board, row, col);

        if (aborted.v) { timedOut = true; break; }

        if (player === MAX_PLAYER) {
          if (s > iterBest) iterBest = s;
          if (iterBest > alpha) alpha = iterBest;
        } else {
          if (s < iterBest) iterBest = s;
          if (iterBest < beta) beta = iterBest;
        }
        if (alpha >= beta) break;

        // Short-circuit once ANY forced outcome is confirmed (either player).
        // Must check Math.abs — opponent can have a forced win too (positive score
        // when it's MIN's turn, negative when it's MAX's turn).
        if (Math.abs(iterBest) >= WIN_CLAMP) break;
      }

      if (!timedOut) {
        bestScore          = iterBest;
        lastCompletedDepth = depth;
      }

      if (onProgress) onProgress(Math.round((depth / maxDepth) * 100));

      // Stop early once ANY forced outcome is confirmed at this depth
      if (Math.abs(bestScore) >= WIN_CLAMP) break;

      await new Promise(r => setTimeout(r, 0));
    }

    if (lastCompletedDepth === 0) {
      return { winner: null, movesCount: null, confident: false, depth: 0 };
    }

    const absScore = Math.abs(bestScore);
    const isForced = absScore >= WIN_CLAMP;

    if (isForced) {
      // Score encoding: score = WIN + remaining_depth_at_win.
      // totalMoves (from current position) = searchDepth - remainingDepthAtWin + 1.
      // The user sees "Jaune gagne dans N coups" as N moves *by Jaune*, not total moves.
      //   If winner == current player:  winner plays moves 1, 3, 5, … → ceil(total/2)
      //   If winner == opponent:        winner plays moves 2, 4, 6, … → floor(total/2)
      const winnerPlayer        = bestScore > 0 ? MAX_PLAYER : MIN_PLAYER;
      const remainingDepthAtWin = absScore - WIN;
      const totalMoves          = Math.max(1, lastCompletedDepth - remainingDepthAtWin + 1);
      const winnerMoves         = winnerPlayer === player
        ? Math.ceil(totalMoves / 2)
        : Math.floor(totalMoves / 2);
      return { winner: winnerPlayer, movesCount: Math.max(1, winnerMoves), confident: true, depth: lastCompletedDepth };
    }

    // Not a forced outcome — return heuristic guess
    let winnerGuess;
    if      (bestScore >  200) winnerGuess = MAX_PLAYER;
    else if (bestScore < -200) winnerGuess = MIN_PLAYER;
    else                       winnerGuess = 0;

    return { winner: winnerGuess, movesCount: null, confident: false, depth: lastCompletedDepth };
  };

  return { getBestMove, getBestMoveAsync, getColumnScores, getColumnScoresAsync, analyseAsync, scoreToLabel, predictAsync };
}
