/**
 * useMlAi — Vue composable for the ML (AlphaZero) AI backend.
 *
 * Provides the same interface as useMinimax so you can swap AI engines:
 *   const { getBestMoveAsync, isThinking } = useMlAi();
 *   const col = await getBestMoveAsync(board, player, simulations, onProgress);
 *
 * The actual computation runs on the Node.js server (ONNX + MCTS).
 * Set the number of MCTS simulations to control strength vs. speed:
 *   50-100  → fast (~0.5s per move)  — good for casual play
 *   200-400 → strong (~1-2s)         — recommended
 *   800+    → very strong (~4-8s)    — maximum strength
 */

import { ref } from 'vue';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useMlAi() {
  const isThinking = ref(false);
  const thinkingProgress = ref(0);
  const lastAnalysis = ref(null);
  /** null = not checked, true = model ready, false = model missing */
  const mlAvailable = ref(null);

  // ── Status ──────────────────────────────────────────────────────────────────

  /**
   * Check if the ML model is loaded on the server.
   * @returns {Promise<boolean>}
   */
  async function checkMlStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/ml/status`);
      const data = await res.json();
      mlAvailable.value = data.modelLoaded === true;
      return mlAvailable.value;
    } catch {
      mlAvailable.value = false;
      return false;
    }
  }

  // ── Main AI interface (matches useMinimax signature) ─────────────────────────

  /**
   * Get the ML AI's best move. Compatible with the useMinimax interface.
   *
   * @param {number[][]} board          Current board (6×7, 0/1/2)
   * @param {number}     currentPlayer  1 or 2
   * @param {number}     [simulations]  MCTS simulations (default 400)
   * @param {Function}   [onProgress]   Called with 0-100 during thinking
   * @returns {Promise<number>}         Best column index
   */
  async function getBestMoveAsync(board, currentPlayer, simulations = 400, onProgress = null) {
    isThinking.value = true;
    thinkingProgress.value = 0;

    // Fake progress animation while waiting for server
    let progressInterval = null;
    if (onProgress) {
      let fakeProgress = 0;
      progressInterval = setInterval(() => {
        fakeProgress = Math.min(fakeProgress + 3, 90);
        thinkingProgress.value = fakeProgress;
        onProgress(fakeProgress);
      }, 80);
    }

    try {
      const res = await fetch(`${API_BASE}/api/ml/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board, currentPlayer, simulations }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `ML request failed: ${res.status}`);
      }

      const data = await res.json();
      lastAnalysis.value = data;

      if (onProgress) onProgress(100);
      thinkingProgress.value = 100;
      return data.bestCol;
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      isThinking.value = false;
    }
  }

  // ── Analysis (per-column scores) ─────────────────────────────────────────────

  /**
   * Analyse all columns using MCTS. Returns per-column visit counts.
   *
   * @param {number[][]} board
   * @param {number}     currentPlayer  1 or 2
   * @param {number}     [simulations]  default 200
   * @returns {Promise<{ bestCol, actionProbs, nnPolicy, value, visitCounts } | null>}
   */
  async function analyzeWithML(board, currentPlayer, simulations = 200) {
    try {
      const res = await fetch(`${API_BASE}/api/ml/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board, currentPlayer, simulations }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      lastAnalysis.value = data;
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Get per-column scores suitable for the Board.vue score display.
   * visitCounts are normalised so the best column = 100.
   *
   * @param {number[][]} board
   * @param {number}     currentPlayer
   * @param {number}     [simulations]
   * @returns {Promise<(number|null)[]>}  length-7 array, null = invalid column
   */
  async function getColumnScoresAsync(board, currentPlayer, simulations = 150) {
    const analysis = await analyzeWithML(board, currentPlayer, simulations);
    if (!analysis || !analysis.visitCounts) return new Array(7).fill(null);

    const visits = analysis.visitCounts;
    const maxVisit = Math.max(...visits.filter(v => v > 0), 1);
    return visits.map((v, col) =>
      board[0][col] !== 0 ? null : Math.round((v / maxVisit) * 100)
    );
  }

  return {
    isThinking,
    thinkingProgress,
    lastAnalysis,
    mlAvailable,
    checkMlStatus,
    getBestMoveAsync,
    analyzeWithML,
    getColumnScoresAsync,
  };
}
