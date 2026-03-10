/**
 * Multiplayer Store
 *
 * Manages all state related to an online multiplayer game session.
 * Updated by the useMultiplayer composable in response to Socket.io events.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useMultiplayerStore = defineStore('multiplayer', () => {
  // ── Connection & identity ────────────────────────────────────────────────
  /** 1 = player 1 (red), 2 = player 2 (yellow), null = spectator / not yet set */
  const myPlayerNumber = ref(null);

  /** The UUID of the room this client is in */
  const roomId = ref(null);

  /** Shareable URL generated after room creation */
  const shareableUrl = ref(null);

  // ── Game state ───────────────────────────────────────────────────────────
  /** Board dimensions */
  const boardSize = ref({ rows: 6, cols: 7 });

  /** 2-D board array: 0 = empty, 1 = red, 2 = yellow */
  const board = ref(
    Array.from({ length: 6 }, () => Array(7).fill(0)),
  );

  /** Player whose turn it is (1 or 2) */
  const currentPlayer = ref(1);

  /** 'lobby' | 'waiting' | 'playing' | 'finished' | 'error' */
  const gameStatus = ref('lobby');

  /** null | 1 | 2 — winning player number, or null for draw */
  const winner = ref(null);

  /** Cells that form the winning line [{row, col}, ...] */
  const winningCells = ref([]);

  /** Full move history [{row, col, player}, ...] */
  const moveHistory = ref([]);

  /** True when the opponent disconnected and grace period is active */
  const opponentDisconnected = ref(false);

  /** Remaining grace period countdown in seconds */
  const disconnectCountdown = ref(0);

  /** Last error message from the server */
  const errorMessage = ref(null);

  // ── Derived ─────────────────────────────────────────────────────────────
  /** True when it's this client's turn */
  const isMyTurn = computed(
    () => gameStatus.value === 'playing' && currentPlayer.value === myPlayerNumber.value,
  );

  /** True if the game is over (win or draw) */
  const isGameOver = computed(() => gameStatus.value === 'finished');

  // ── Mutations ────────────────────────────────────────────────────────────

  const setRoom = (id, url) => {
    roomId.value = id;
    shareableUrl.value = url;
  };

  const setPlayerNumber = (num) => { myPlayerNumber.value = num; };

  const setBoardSize = (size) => {
    boardSize.value = size;
    board.value = Array.from({ length: size.rows }, () => Array(size.cols).fill(0));
  };

  const setBoard = (newBoard) => { board.value = newBoard; };

  const setCurrentPlayer = (p) => { currentPlayer.value = p; };

  const setGameStatus = (s) => { gameStatus.value = s; };

  const setWinner = (w, cells = []) => {
    winner.value = w;
    winningCells.value = cells;
  };

  const setMoveHistory = (history) => { moveHistory.value = history; };

  const setOpponentDisconnected = (val) => { opponentDisconnected.value = val; };
  const setDisconnectCountdown = (val) => { disconnectCountdown.value = val; };

  const setError = (msg) => { errorMessage.value = msg; };

  const reset = () => {
    myPlayerNumber.value = null;
    roomId.value = null;
    shareableUrl.value = null;
    boardSize.value = { rows: 6, cols: 7 };
    board.value = Array.from({ length: 6 }, () => Array(7).fill(0));
    currentPlayer.value = 1;
    gameStatus.value = 'lobby';
    winner.value = null;
    winningCells.value = [];
    moveHistory.value = [];
    opponentDisconnected.value = false;
    disconnectCountdown.value = 0;
    errorMessage.value = null;
  };

  return {
    // State
    myPlayerNumber,
    roomId,
    shareableUrl,
    boardSize,
    board,
    currentPlayer,
    gameStatus,
    winner,
    winningCells,
    moveHistory,
    opponentDisconnected,
    disconnectCountdown,
    errorMessage,
    // Derived
    isMyTurn,
    isGameOver,
    // Mutations
    setRoom,
    setPlayerNumber,
    setBoardSize,
    setBoard,
    setCurrentPlayer,
    setGameStatus,
    setWinner,
    setMoveHistory,
    setOpponentDisconnected,
    setDisconnectCountdown,
    setError,
    reset,
  };
});
