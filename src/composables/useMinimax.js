// src/composables/useMinimax.js
// Minimax with alpha-beta pruning, transposition table, and forced-win compression.

export function useMinimax() {

  const MAX_PLAYER = 2; // IA
  const MIN_PLAYER = 1; // Humain
  const EMPTY = 0;
  // Scores >= WIN_SCORE are considered a forced win for MAX_PLAYER
  const WIN_SCORE = 9000;

  const copyBoard = (board) => board.map(row => [...row]);

  /** Compact string key for the transposition table. */
  const boardKey = (board, depth, isMax) =>
    board.map(r => r.join('')).join('|') + `|${depth}|${isMax ? 1 : 0}`;

  const checkWinForMinimax = (board, player) => {
    const rows = board.length;
    const cols = board[0].length;

    // Horizontal
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        if (board[r][c] === player &&
            board[r][c + 1] === player &&
            board[r][c + 2] === player &&
            board[r][c + 3] === player) return true;
      }
    }

    // Vertical
    for (let r = 0; r <= rows - 4; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === player &&
            board[r + 1][c] === player &&
            board[r + 2][c] === player &&
            board[r + 3][c] === player) return true;
      }
    }

    // Diagonal (down-right)
    for (let r = 0; r <= rows - 4; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        if (board[r][c] === player &&
            board[r + 1][c + 1] === player &&
            board[r + 2][c + 2] === player &&
            board[r + 3][c + 3] === player) return true;
      }
    }

    // Diagonal (up-right)
    for (let r = 3; r < rows; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        if (board[r][c] === player &&
            board[r - 1][c + 1] === player &&
            board[r - 2][c + 2] === player &&
            board[r - 3][c + 3] === player) return true;
      }
    }

    return false;
  };

  // Evaluate a window of 4 cells
  const evaluateWindow = (window, player) => {
    const opponent = player === MAX_PLAYER ? MIN_PLAYER : MAX_PLAYER;
    const playerCount = window.filter(c => c === player).length;
    const emptyCount = window.filter(c => c === EMPTY).length;
    const opponentCount = window.filter(c => c === opponent).length;

    // Scoring
    if (playerCount === 4) return 100;
    if (playerCount === 3 && emptyCount === 1) return 5;
    if (playerCount === 2 && emptyCount === 2) return 2;
    
    // Penalize opponent threats
    if (opponentCount === 3 && emptyCount === 1) return -4;
    
    return 0;
  };

  // Heuristic evaluation of board position
  const evaluateBoard = (board) => {
    const rows = board.length;
    const cols = board[0].length;
    let score = 0;

    // Prefer center column (very important in Connect 4)
    const centerCol = Math.floor(cols / 2);
    let centerCount = 0;
    for (let r = 0; r < rows; r++) {
      if (board[r][centerCol] === MAX_PLAYER) centerCount++;
    }
    score += centerCount * 3;

    // Evaluate horizontal windows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        const window = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]];
        score += evaluateWindow(window, MAX_PLAYER);
      }
    }

    // Evaluate vertical windows
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r <= rows - 4; r++) {
        const window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];
        score += evaluateWindow(window, MAX_PLAYER);
      }
    }

    // Evaluate diagonal (down-right) windows
    for (let r = 0; r <= rows - 4; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
        score += evaluateWindow(window, MAX_PLAYER);
      }
    }

    // Evaluate diagonal (up-right) windows
    for (let r = 3; r < rows; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        const window = [board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]];
        score += evaluateWindow(window, MAX_PLAYER);
      }
    }

    return score;
  };

  // Get available columns, ordered by distance from center (center first for better pruning)
  const getAvailableCol = (board) => {
    const cols = board[0].length;
    const center = Math.floor(cols / 2);
    const available = [];
    
    for (let c = 0; c < cols; c++) {
      if (board[0][c] === 0) available.push(c);
    }
    
    // Sort by distance from center (closest first)
    available.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
    return available;
  };

  const makeMove = (board, col, player) => {
    for (let r = board.length - 1; r >= 0; r--) {
      if (board[r][col] === 0) {
        board[r][col] = player;
        return r; // Return the row where piece was placed
      }
    }
    return -1;
  };

  const isTerminal = (board) => {
    return checkWinForMinimax(board, MAX_PLAYER) || 
           checkWinForMinimax(board, MIN_PLAYER) || 
           getAvailableCol(board).length === 0;
  };

  /**
   * Minimax with alpha-beta + transposition table.
   * @param {Map} tt - transposition table (created fresh per root call)
   */
  const minimax = (board, depth, isMaximizing, alpha = -Infinity, beta = Infinity, tt = new Map()) => {
    const key = boardKey(board, depth, isMaximizing);
    if (tt.has(key)) return tt.get(key);

    // Terminal checks
    if (checkWinForMinimax(board, MAX_PLAYER)) { const s = 10000 + depth; tt.set(key, s); return s; }
    if (checkWinForMinimax(board, MIN_PLAYER)) { const s = -10000 - depth; tt.set(key, s); return s; }
    const avail = getAvailableCol(board);
    if (avail.length === 0)                     { tt.set(key, 0); return 0; }
    if (depth === 0) { const s = evaluateBoard(board); tt.set(key, s); return s; }

    if (isMaximizing) {
      let best = -Infinity;
      for (const col of avail) {
        const nb = copyBoard(board);
        makeMove(nb, col, MAX_PLAYER);
        const s = minimax(nb, depth - 1, false, alpha, beta, tt);
        best = Math.max(best, s);
        alpha = Math.max(alpha, s);
        // ── Forced-win compression: guaranteed win found, stop immediately ──
        if (best >= WIN_SCORE) break;
        if (beta <= alpha) break;
      }
      tt.set(key, best);
      return best;
    } else {
      let best = Infinity;
      for (const col of avail) {
        const nb = copyBoard(board);
        makeMove(nb, col, MIN_PLAYER);
        const s = minimax(nb, depth - 1, true, alpha, beta, tt);
        best = Math.min(best, s);
        beta = Math.min(beta, s);
        if (best <= -WIN_SCORE) break;
        if (beta <= alpha) break;
      }
      tt.set(key, best);
      return best;
    }
  };

  const getBestMove = (board, depth = 4, onProgress = null) => {
    const tt = new Map();
    let bestScore = -Infinity;
    let move = null;
    let alpha = -Infinity;
    const beta = Infinity;
    const availableCols = getAvailableCol(board);
    const totalCols = availableCols.length;
    
    availableCols.forEach((col, index) => {
      const newBoard = copyBoard(board);
      makeMove(newBoard, col, MAX_PLAYER);
      const score = minimax(newBoard, depth - 1, false, alpha, beta, tt);
      if (score > bestScore) { bestScore = score; move = col; }
      alpha = Math.max(alpha, score);
      if (onProgress) onProgress(Math.round(((index + 1) / totalCols) * 100));
      // Early exit on forced win
      if (bestScore >= WIN_SCORE) return;
    });
    console.log(`[Minimax] best=${bestScore} col=${move} tt=${tt.size}`);
    return move;
  };

  // Async version for smooth UI progress updates
  const getBestMoveAsync = async (board, depth = 4, onProgress = null) => {
    const tt = new Map();
    let bestScore = -Infinity;
    let move = null;
    let alpha = -Infinity;
    const beta = Infinity;
    const availableCols = getAvailableCol(board);
    const totalCols = availableCols.length;
    
    for (let index = 0; index < availableCols.length; index++) {
      const col = availableCols[index];
      const newBoard = copyBoard(board);
      makeMove(newBoard, col, MAX_PLAYER);
      const score = minimax(newBoard, depth - 1, false, alpha, beta, tt);
      if (score > bestScore) { bestScore = score; move = col; }
      alpha = Math.max(alpha, score);
      if (onProgress) {
        onProgress(Math.round(((index + 1) / totalCols) * 100));
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      // Early exit: forced win found
      if (bestScore >= WIN_SCORE) {
        if (onProgress) onProgress(100);
        break;
      }
    }
    console.log(`[Minimax async] best=${bestScore} col=${move} tt=${tt.size}`);
    return move;
  };

  /**
   * Single-pass analysis: returns { bestCol, scores[], bestScore }.
   * More efficient than calling getColumnScores + getBestMove separately.
   * Used by "IA jouerait" suggestion button.
   */
  const analyseAsync = async (board, depth = 4, onProgress = null) => {
    const tt = new Map();
    const cols = board[0].length;
    const scores = Array(cols).fill(null);
    let bestScore = -Infinity;
    let bestCol = null;
    let alpha = -Infinity;
    const avail = getAvailableCol(board);

    for (let i = 0; i < avail.length; i++) {
      const col = avail[i];
      const nb = copyBoard(board);
      makeMove(nb, col, MAX_PLAYER);
      const s = minimax(nb, depth - 1, false, alpha, Infinity, tt);
      scores[col] = s;
      if (s > bestScore) { bestScore = s; bestCol = col; }
      alpha = Math.max(alpha, s);
      if (onProgress) {
        onProgress(Math.round(((i + 1) / avail.length) * 100));
        await new Promise(r => setTimeout(r, 0));
      }
      if (bestScore >= WIN_SCORE) {
        if (onProgress) onProgress(100);
        break;
      }
    }
    return { bestCol, scores, bestScore };
  };

  // Returns an array of scores for each column (null if column is full)
  // Uses a capped depth for display to avoid UI freezes
  const getColumnScores = (board, depth = 4) => {
    const displayDepth = Math.min(depth, 4);
    const tt = new Map();
    const cols = board[0].length;
    const scores = [];
    for (let col = 0; col < cols; col++) {
      if (board[0][col] !== 0) { scores.push(null); continue; }
      const newBoard = copyBoard(board);
      makeMove(newBoard, col, MAX_PLAYER);
      scores.push(minimax(newBoard, displayDepth - 1, false, -Infinity, Infinity, tt));
    }
    return scores;
  };

  // Async version of getColumnScores for use in watchers
  const getColumnScoresAsync = async (board, depth = 4) => {
    const displayDepth = Math.min(depth, 4);
    const tt = new Map();
    const cols = board[0].length;
    const scores = [];
    for (let col = 0; col < cols; col++) {
      if (board[0][col] !== 0) { scores.push(null); continue; }
      const newBoard = copyBoard(board);
      makeMove(newBoard, col, MAX_PLAYER);
      scores.push(minimax(newBoard, displayDepth - 1, false, -Infinity, Infinity, tt));
      if (col % 2 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    return scores;
  };

  return { getBestMove, getBestMoveAsync, getColumnScores, getColumnScoresAsync, analyseAsync };
}
