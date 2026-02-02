// src/composables/useMinimax.js

export function useMinimax() {

  const MAX_PLAYER = 2; // IA
  const MIN_PLAYER = 1; // Humain
  const EMPTY = 0;

  const copyBoard = (board) => board.map(row => [...row]);

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

  const minimax = (board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) => {
    // Check for terminal states
    if (checkWinForMinimax(board, MAX_PLAYER)) return 10000 + depth; // Prefer faster wins
    if (checkWinForMinimax(board, MIN_PLAYER)) return -10000 - depth; // Delay losses
    if (getAvailableCol(board).length === 0) return 0; // Draw

    // Use heuristic evaluation at depth 0
    if (depth === 0) return evaluateBoard(board);

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let col of getAvailableCol(board)) {
        const newBoard = copyBoard(board);
        makeMove(newBoard, col, MAX_PLAYER);
        const score = minimax(newBoard, depth - 1, false, alpha, beta);
        bestScore = Math.max(score, bestScore);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let col of getAvailableCol(board)) {
        const newBoard = copyBoard(board);
        makeMove(newBoard, col, MIN_PLAYER);
        const score = minimax(newBoard, depth - 1, true, alpha, beta);
        bestScore = Math.min(score, bestScore);
        beta = Math.min(beta, score);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return bestScore;
    }
  };

  const getBestMove = (board, depth = 4, onProgress = null) => {
    let bestScore = -Infinity;
    let move = null;
    let alpha = -Infinity;
    const beta = Infinity;
    const availableCols = getAvailableCol(board);
    const totalCols = availableCols.length;
    
    availableCols.forEach((col, index) => {
      const newBoard = copyBoard(board);
      makeMove(newBoard, col, MAX_PLAYER);
      const score = minimax(newBoard, depth - 1, false, alpha, beta);
      if (score > bestScore) {
        bestScore = score;
        move = col;
      }
      alpha = Math.max(alpha, score);
      // Report progress
      if (onProgress) {
        const progress = Math.round(((index + 1) / totalCols) * 100);
        onProgress(progress);
      }
    });
    return move;
  };

  // Async version for smooth UI progress updates
  const getBestMoveAsync = async (board, depth = 4, onProgress = null) => {
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
      const score = minimax(newBoard, depth - 1, false, alpha, beta);
      if (score > bestScore) {
        bestScore = score;
        move = col;
      }
      alpha = Math.max(alpha, score);
      // Report progress and yield to UI thread
      if (onProgress) {
        const progress = Math.round(((index + 1) / totalCols) * 100);
        onProgress(progress);
        // Small delay to allow UI to render the progress update
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    return move;
  };

  // Returns an array of scores for each column (null if column is full)
  // Uses a capped depth for display to avoid UI freezes
  const getColumnScores = (board, depth = 4) => {
    // Cap display depth to prevent UI freezes
    const displayDepth = Math.min(depth, 4);
    const cols = board[0].length;
    const scores = [];
    for (let col = 0; col < cols; col++) {
      if (board[0][col] !== 0) {
        scores.push(null); // Column is full
      } else {
        const newBoard = copyBoard(board);
        makeMove(newBoard, col, MAX_PLAYER);
        const score = minimax(newBoard, displayDepth - 1, false, -Infinity, Infinity);
        scores.push(score);
      }
    }
    return scores;
  };

  // Async version of getColumnScores for use in watchers
  const getColumnScoresAsync = async (board, depth = 4) => {
    // Cap display depth to prevent UI freezes
    const displayDepth = Math.min(depth, 4);
    const cols = board[0].length;
    const scores = [];
    for (let col = 0; col < cols; col++) {
      if (board[0][col] !== 0) {
        scores.push(null); // Column is full
      } else {
        const newBoard = copyBoard(board);
        makeMove(newBoard, col, MAX_PLAYER);
        const score = minimax(newBoard, displayDepth - 1, false, -Infinity, Infinity);
        scores.push(score);
      }
      // Yield to UI thread periodically
      if (col % 2 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    return scores;
  };

  return { getBestMove, getBestMoveAsync, getColumnScores, getColumnScoresAsync };
}
