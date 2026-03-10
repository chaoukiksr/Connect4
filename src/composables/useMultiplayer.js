/**
 * useMultiplayer
 *
 * Composable that manages the Socket.io connection and all multiplayer
 * game logic. Keeps the multiplayerStore in sync with server events.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *
 *   const { createGame, joinGame, sendMove, disconnect } = useMultiplayer();
 *
 *   // Create a room (calls REST API then registers via socket)
 *   await createGame({ rows: 6, cols: 7 });
 *
 *   // Join an existing room (called from /game/:roomId route)
 *   await joinGame(roomId);
 *
 *   // Play a move
 *   sendMove(col);
 *
 * ─── Socket Events Handled ───────────────────────────────────────────────────
 *
 *   roomCreated        → store: gameStatus = 'waiting', shareableUrl set
 *   roomJoined         → store: playerNumber set, gameStatus = 'waiting'
 *   gameStarted        → store: board reset, gameStatus = 'playing'
 *   moveMade           → store: board & currentPlayer updated
 *   gameEnded          → store: winner set, gameStatus = 'finished'
 *   playerDisconnected → store: opponentDisconnected = true, countdown
 *   playerReconnected  → store: opponentDisconnected = false
 *   roomState          → store: full sync after reconnect
 *   roomError          → store: errorMessage set
 */

import { io } from 'socket.io-client';
import { ref } from 'vue';
import { useMultiplayerStore } from '../stores/multiplayerStore';

// ── Determine server URL ──────────────────────────────────────────────────────
// Set VITE_SOCKET_URL in .env.local for production (e.g. https://your-api.onrender.com)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Singleton socket — created once, reused across component unmounts
let socket = null;
let countdownInterval = null;

export function useMultiplayer() {
  const store = useMultiplayerStore();
  const isConnecting = ref(false);

  // ── Socket lifecycle ────────────────────────────────────────────────────

  /**
   * Ensure the socket is connected. Creates a new connection if needed.
   */
  const ensureConnected = () => {
    if (socket && socket.connected) return socket;

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      store.setError('Unable to connect to the game server. Please try again.');
    });

    // Register all event listeners
    registerListeners();

    return socket;
  };

  /**
   * Register Socket.io event listeners. Called once per socket instance.
   */
  const registerListeners = () => {
    // ── roomCreated: Player 1 successfully registered in the room
    socket.on('roomCreated', ({ roomId, boardSize, playerNumber }) => {
      store.setPlayerNumber(playerNumber);
      store.setRoom(roomId, `${window.location.origin}/game/${roomId}`);
      store.setBoardSize(boardSize);
      store.setGameStatus('waiting');
      console.log('[Socket] Room created:', roomId);
    });

    // ── roomJoined: Player 2 successfully joined the room
    socket.on('roomJoined', ({ roomId, boardSize, playerNumber }) => {
      store.setPlayerNumber(playerNumber);
      store.setRoom(roomId, `${window.location.origin}/game/${roomId}`);
      store.setBoardSize(boardSize);
      store.setGameStatus('waiting');
      console.log('[Socket] Joined room:', roomId, 'as player', playerNumber);
    });

    // ── gameStarted: Both players are in — game begins
    socket.on('gameStarted', ({ board, currentPlayer, boardSize, yourPlayer }) => {
      store.setPlayerNumber(yourPlayer);
      store.setBoardSize(boardSize);
      store.setBoard(board);
      store.setCurrentPlayer(currentPlayer);
      store.setGameStatus('playing');
      store.setWinner(null, []);
      store.setMoveHistory([]);
      console.log('[Socket] Game started — you are player', yourPlayer);
    });

    // ── moveMade: A piece was played (by either player)
    socket.on('moveMade', ({ board, move, currentPlayer }) => {
      store.setBoard(board);
      store.setCurrentPlayer(currentPlayer);
      store.moveHistory.push(move);
    });

    // ── gameEnded: Win, draw, or forfeit
    socket.on('gameEnded', ({ winner, winningCells, moves, forfeit }) => {
      store.setWinner(winner, winningCells ?? []);
      store.setMoveHistory(moves ?? []);
      store.setGameStatus('finished');
      if (forfeit) {
        store.setError(null); // Clear any previous errors
      }
      console.log('[Socket] Game ended — winner:', winner ?? 'draw');
    });

    // ── playerDisconnected: Opponent lost connection, grace period started
    socket.on('playerDisconnected', ({ playerNumber, gracePeriodMs }) => {
      store.setOpponentDisconnected(true);
      store.setDisconnectCountdown(Math.ceil(gracePeriodMs / 1000));

      // Start visual countdown
      clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        const next = store.disconnectCountdown - 1;
        if (next <= 0) {
          clearInterval(countdownInterval);
          store.setDisconnectCountdown(0);
        } else {
          store.setDisconnectCountdown(next);
        }
      }, 1000);

      console.log(`[Socket] Player ${playerNumber} disconnected — ${gracePeriodMs / 1000}s grace`);
    });

    // ── playerReconnected: Opponent came back
    socket.on('playerReconnected', ({ playerNumber }) => {
      store.setOpponentDisconnected(false);
      store.setDisconnectCountdown(0);
      clearInterval(countdownInterval);
      console.log(`[Socket] Player ${playerNumber} reconnected`);
    });

    // ── roomState: Full sync after reconnect
    socket.on('roomState', ({ board, currentPlayer, boardSize, yourPlayer, moveHistory, gameStatus }) => {
      store.setPlayerNumber(yourPlayer);
      store.setBoardSize(boardSize);
      store.setBoard(board);
      store.setCurrentPlayer(currentPlayer);
      store.setMoveHistory(moveHistory ?? []);
      store.setGameStatus(gameStatus ?? 'playing');
      console.log('[Socket] Room state synced after reconnect');
    });

    // ── playerJoined: Opponent entered the waiting room
    socket.on('playerJoined', ({ playerCount }) => {
      console.log('[Socket] Player joined — count:', playerCount);
    });

    // ── roomError: Server rejected an action
    socket.on('roomError', ({ message }) => {
      store.setError(message);
      console.warn('[Socket] Room error:', message);
    });
  };

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Create a new game room.
   * 1. Calls POST /api/rooms (HTTP) → gets roomId
   * 2. Emits `createRoom` via socket to register as player 1
   *
   * @param {object} boardSize - { rows, cols }
   * @returns {Promise<string>} roomId
   */
  const createGame = async (boardSize = { rows: 6, cols: 7 }) => {
    isConnecting.value = true;
    store.reset();

    try {
      // Step 1: Create room via HTTP
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardSize }),
      });

      if (!res.ok) throw new Error('Failed to create room on server');
      const { roomId } = await res.json();

      // Step 2: Connect socket and register as player 1
      ensureConnected();
      socket.emit('createRoom', { roomId });

      store.setRoom(roomId, `${window.location.origin}/game/${roomId}`);

      return roomId;
    } catch (err) {
      store.setError(err.message);
      throw err;
    } finally {
      isConnecting.value = false;
    }
  };

  /**
   * Join an existing game room (player 2 or reconnect).
   * Emits `joinRoom` via socket.
   *
   * @param {string} roomId
   */
  const joinGame = async (roomId) => {
    isConnecting.value = true;

    // If we're reconnecting to the same room we were in, keep store state
    if (store.roomId !== roomId) {
      store.reset();
      store.setRoom(roomId, `${window.location.origin}/game/${roomId}`);
    }

    try {
      // Verify room still exists via HTTP before opening socket
      const res = await fetch(`${API_URL}/rooms/${roomId}`);
      if (!res.ok) {
        store.setError('Room not found or game has ended.');
        return;
      }

      ensureConnected();
      socket.emit('joinRoom', { roomId });
    } catch (err) {
      store.setError('Could not connect to the room. Check your internet connection.');
    } finally {
      isConnecting.value = false;
    }
  };

  /**
   * Send a move to the server.
   * The server will validate it, apply it, and broadcast the result.
   *
   * @param {number} col - 0-indexed column number
   */
  const sendMove = (col) => {
    if (!socket || !socket.connected) {
      store.setError('Not connected to the game server.');
      return;
    }
    if (!store.isMyTurn) return; // Guard against out-of-turn clicks

    socket.emit('makeMove', { roomId: store.roomId, col });
  };

  /**
   * Disconnect from the server and reset multiplayer state.
   */
  const disconnect = () => {
    clearInterval(countdownInterval);
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    store.reset();
  };

  return {
    isConnecting,
    createGame,
    joinGame,
    sendMove,
    disconnect,
  };
}
