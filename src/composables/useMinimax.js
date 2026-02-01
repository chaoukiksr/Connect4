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

  const minimax = (board, depth, isMaximizing) => {
    if (checkWinForMinimax(board, MAX_PLAYER)) return 100 - depth;
    if (checkWinForMinimax(board, MIN_PLAYER)) return -100 + depth;
    if (getAvailableCol(board).length === 0) return 0;

    if (depth === 0) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let col of getAvailableCol(board)) {
        const newBoard = copyBoard(board);
        makeMove(newBoard, col, MAX_PLAYER);
        const score = minimax(newBoard, depth - 1, false);
        bestScore = Math.max(score, bestScore);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let col of getAvailableCol(board)) {
        const newBoard = copyBoard(board);
        makeMove(newBoard, col, MIN_PLAYER);
        const score = minimax(newBoard, depth - 1, true);
        bestScore = Math.min(score, bestScore);
      }
      return bestScore;
    }
  };

  const getBestMove = (board, depth = 4) => {
    let bestScore = -Infinity;
    let move = null;
    for (let col of getAvailableCol(board)) {
      const newBoard = copyBoard(board);
      makeMove(newBoard, col, MAX_PLAYER);
      const score = minimax(newBoard, depth - 1, false);
      if (score > bestScore) {
        bestScore = score;
        move = col;
      }
    }
    return move;
  };

  return { getBestMove };
}
