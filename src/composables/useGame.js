import { useGameSettingsStore } from "../stores/gameSettings";
import { useGameStateStore } from "../stores/gameState";
import { storeToRefs } from "pinia";
import { useWinCheck } from "./useWinCheck";
import { useGameFlow } from "./useGameFlow";
import { useMinimax } from "./useMinimax"; // <- import du minimax

export function useGame() {
  const { isCurrentPlayerAI, triggerAIMove, setFillColCallback } = useGameFlow();
  const gameSettingsStore = useGameSettingsStore();
  const gameStateStore = useGameStateStore();

  const { boardSize, aiDepth } = storeToRefs(gameSettingsStore);
  const { board, currentPlayer, gameStatus } = storeToRefs(gameStateStore);
  const { addMove } = gameStateStore;

  const { checkProbableWin } = useWinCheck();
  const { getBestMove } = useMinimax(); // <- on récupère la fonction

  const isColAvailable = (col) => board.value[0][col] === 0;

  const getAvailableCol = () => {
    const cols = [];
    for (let i = 0; i < boardSize.value.cols; i++) {
      if (isColAvailable(i)) cols.push(i);
    }
    return cols;
  };

  const fillCol = (col) => {
    if (gameStatus.value !== "playing") return;
    if (!isColAvailable(col)) return;

    for (let r = boardSize.value.rows - 1; r >= 0; r--) {
      if (board.value[r][col] === 0) {
        board.value[r][col] = currentPlayer.value;
        addMove(r, col, currentPlayer.value);
        checkProbableWin(r, col, currentPlayer.value);

        currentPlayer.value = currentPlayer.value === 1 ? 2 : 1;

        if (gameStatus.value === "playing" && isCurrentPlayerAI()) {
          triggerAIMove(() => {
            const aiCol = getBestMove(board.value, aiDepth.value);
            if (aiCol !== null) fillCol(aiCol);
          });
        }
        break;
      }
    }
  };

  const startGame = () => {
    setFillColCallback(fillCol);

    if (isCurrentPlayerAI()) {
      triggerAIMove(() => {
        const aiCol = getBestMove(board.value, aiDepth.value);
        if (aiCol !== null) fillCol(aiCol);
      });
    }
  };

  return { fillCol, isColAvailable, getAvailableCol, startGame };
}
