// src/composables/useMinimax.js

export function useMinimax() {

  const MAX_PLAYER = 2; // IA
  const MIN_PLAYER = 1; // Humain

  const copyBoard = (board) => board.map(row => [...row]);

  const checkWinForMinimax = (board, player) => {
    const rows = board.length;
    const cols = board[0].length;

    const checkLine = (cells) => {
      let count = 0;
      for (let c of cells) {
        if (c === player) count++;
        else count = 0;
        if (count >= 4) return true;
      }
      return false;
    };

    // Horizontal
    for (let r = 0; r < rows; r++) {
      if (checkLine(board[r])) return true;
    }

    // Vertical
    for (let c = 0; c < cols; c++) {
      let colArray = [];
      for (let r = 0; r < rows; r++) colArray.push(board[r][c]);
      if (checkLine(colArray)) return true;
    }

    // Diagonales
    for (let r = 0; r < rows - 3; r++) {
      for (let c = 0; c < cols - 3; c++) {
        if (
          board[r][c] === player &&
          board[r + 1][c + 1] === player &&
          board[r + 2][c + 2] === player &&
          board[r + 3][c + 3] === player
        ) return true;
      }
    }

    for (let r = 3; r < rows; r++) {
      for (let c = 0; c < cols - 3; c++) {
        if (
          board[r][c] === player &&
          board[r - 1][c + 1] === player &&
          board[r - 2][c + 2] === player &&
          board[r - 3][c + 3] === player
        ) return true;
      }
    }

    return false;
  };

  const getAvailableCol = (board) => {
    const cols = [];
    for (let c = 0; c < board[0].length; c++) {
      if (board[0][c] === 0) cols.push(c);
    }
    return cols;
  };

  const makeMove = (board, col, player) => {
    for (let r = board.length - 1; r >= 0; r--) {
      if (board[r][col] === 0) {
        board[r][col] = player;
        break;
      }
    }
  };

  const minimax = (board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) => {
    if (checkWinForMinimax(board, MAX_PLAYER)) return 100 - depth;
    if (checkWinForMinimax(board, MIN_PLAYER)) return -100 + depth;
    if (getAvailableCol(board).length === 0) return 0;

    if (depth === 0) return 0;

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
