import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useGameSettingsStore } from './gameSettings'

export const useGameStateStore = defineStore('gameState', () => {
  const gameSettings = useGameSettingsStore();
  const { boardSize } = storeToRefs(gameSettings);

  const gameStatus = ref('start'); // 'start' | 'playing' | 'paused' | 'finished' | 'replay'
  const winner = ref(null);
  const currentPlayer = ref(1);

  const board = ref(
    Array(boardSize.value.rows)
      .fill()
      .map(() => Array(boardSize.value.cols).fill(0))
  );

  const winningCells = ref([]);
  const moveHistory = ref([]);
  const historyIndex = ref(-1);
  const aiThinkingProgress = ref(0);

  // Journal (event log)
  const gameLogs = ref([]);

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    gameLogs.value.unshift({ time, message }); // newest first
    if (gameLogs.value.length > 100) gameLogs.value.pop();
  };

  const clearLogs = () => { gameLogs.value = []; };

  const setAiThinkingProgress = (progress) => {
    aiThinkingProgress.value = progress;
  };

  /**
   * Add a move to history, clearing any future (redo) entries first.
   * This ensures redo stack is invalidated when a new move is played after undo.
   */
  const addMove = (row, col, player) => {
    // If we're not at the end of history, clear future moves
    if (historyIndex.value < moveHistory.value.length - 1) {
      moveHistory.value = moveHistory.value.slice(0, historyIndex.value + 1);
    }
    moveHistory.value.push({ row, col, player });
    historyIndex.value++;
  };

  /** Undo the last move (remove piece, restore player turn). */
  const undo = () => {
    if (historyIndex.value < 0) return false;
    const move = moveHistory.value[historyIndex.value];
    board.value[move.row][move.col] = 0;
    currentPlayer.value = move.player; // it's that player's turn again
    historyIndex.value--;
    // Clear win state when stepping back
    winner.value = null;
    winningCells.value = [];
    return true;
  };

  /** Redo the next move in history (place piece, update player turn). */
  const redo = () => {
    if (historyIndex.value >= moveHistory.value.length - 1) return false;
    historyIndex.value++;
    const move = moveHistory.value[historyIndex.value];
    board.value[move.row][move.col] = move.player;
    currentPlayer.value = move.player === 1 ? 2 : 1; // next player's turn
    return true;
  };

  /**
   * Load a pre-built move array for replay mode.
   * Resets the board to empty; caller can step through with redo().
   */
  const loadReplay = (moves, startPlayer = 1) => {
    board.value = Array(boardSize.value.rows)
      .fill()
      .map(() => Array(boardSize.value.cols).fill(0));
    winner.value = null;
    winningCells.value = [];
    aiThinkingProgress.value = 0;
    gameLogs.value = [];
    moveHistory.value = moves;
    historyIndex.value = -1; // board is empty — step forward with redo()
    currentPlayer.value = startPlayer;
    gameStatus.value = 'replay';
    addLog('Partie BGA chargée — prêt pour la relecture.');
  };

  const setCurrentPlayer = (player) => { currentPlayer.value = player; };
  const setGameStatus = (status) => { gameStatus.value = status; };
  const setWinner = (player) => { winner.value = player; };
  const setWinningCells = (cells) => { winningCells.value = cells; };

  const resetGame = () => {
    const { startingPlayer } = storeToRefs(gameSettings);
    currentPlayer.value = startingPlayer.value === 'red' ? 1 : 2;
    gameStatus.value = 'start';
    winner.value = null;
    winningCells.value = [];
    aiThinkingProgress.value = 0;
    moveHistory.value = [];
    historyIndex.value = -1;
    gameLogs.value = [];
    board.value = Array(boardSize.value.rows)
      .fill()
      .map(() => Array(boardSize.value.cols).fill(0));
  };

  return {
    gameStatus,
    winner,
    currentPlayer,
    board,
    winningCells,
    moveHistory,
    historyIndex,
    aiThinkingProgress,
    gameLogs,
    addLog,
    clearLogs,
    setCurrentPlayer,
    setGameStatus,
    setWinner,
    setWinningCells,
    setAiThinkingProgress,
    resetGame,
    addMove,
    undo,
    redo,
    loadReplay,
  };
});

