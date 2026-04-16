import { useGameSettingsStore } from "../stores/gameSettings";
import { useGameStateStore } from "../stores/gameState";
import { storeToRefs } from "pinia";
import { useWinCheck } from "./useWinCheck";
import { useGameFlow } from "./useGameFlow";
import { useMinimax } from "./useMinimax";
import { useMlAi } from "./useMlAi";

export function useGame() {
  const { isCurrentPlayerAI, triggerAIMove, setFillColCallback } = useGameFlow();
  const gameSettingsStore = useGameSettingsStore();
  const gameStateStore = useGameStateStore();

  const { boardSize, aiDepth, aiMode, mlSimulations } = storeToRefs(gameSettingsStore);
  const { board, currentPlayer, gameStatus } = storeToRefs(gameStateStore);
  const { addMove, setAiThinkingProgress, addLog } = gameStateStore;
  const {moveHistory} = storeToRefs(gameStateStore);
  const { checkProbableWin } = useWinCheck();
  const { getBestMoveAsync } = useMinimax();
  const { getBestMoveAsync: getMlMoveAsync } = useMlAi();

  const isClassicBoard = () => boardSize.value.rows === 6 && boardSize.value.cols === 7;

  const toMinimaxPerspectiveBoard = (sourceBoard, aiPlayer) => {
    // useMinimax is currently coded with MAX_PLAYER=2 and MIN_PLAYER=1.
    // If AI plays as player 1, swap tokens so minimax still reasons correctly.
    if (aiPlayer === 2) {
      return sourceBoard.map((row) => row.slice());
    }

    return sourceBoard.map((row) =>
      row.map((cell) => {
        if (cell === 1) return 2;
        if (cell === 2) return 1;
        return 0;
      })
    );
  };

  const computeMinimaxMove = async () => {
    const boardForSearch = toMinimaxPerspectiveBoard(board.value, currentPlayer.value);
    return getBestMoveAsync(boardForSearch, aiDepth.value, (progress) => {
      setAiThinkingProgress(progress);
    });
  };

  const computeAiMove = async () => {
    setAiThinkingProgress(0);

    if (aiMode.value === 'ml') {
      if (!isClassicBoard()) {
        addLog('⚠ ML supporte uniquement la grille 6x7. Bascule sur Minimax.');
        return computeMinimaxMove();
      }

      try {
        return await getMlMoveAsync(board.value, currentPlayer.value, mlSimulations.value, (progress) => {
          setAiThinkingProgress(progress);
        });
      } catch (err) {
        addLog(`⚠ ML indisponible (${err.message}). Bascule sur Minimax.`);
        return computeMinimaxMove();
      }
    }

    return computeMinimaxMove();
  };

  const isColAvailable = (col) => board.value[0][col] === 0;

  const getAvailableCol = () => {
    const cols = [];
    for (let i = 0; i < boardSize.value.cols; i++) {
      if (isColAvailable(i)) cols.push(i);
    }
    return cols;
  };
/*Fonction appelée quand un joueur clique sur une colonne*/
  const fillCol = (col) => {
    if (gameStatus.value !== "playing") return;
    /*Interdit de jouer dans une colonne pleine.*/
    if (!isColAvailable(col)) return;

    // Réinitialise la barre de progression IA.
    if (!isCurrentPlayerAI()) {
      setAiThinkingProgress(0);
    }

    for (let r = boardSize.value.rows - 1; r >= 0; r--) {
      if (board.value[r][col] === 0) {
        board.value[r][col] = currentPlayer.value;
        addMove(r, col, currentPlayer.value);
        addLog(`${currentPlayer.value === 1 ? '🔴 Rouge' : '🟡 Jaune'} joue en colonne ${col + 1}`);
        checkProbableWin(r, col, currentPlayer.value);

        currentPlayer.value = currentPlayer.value === 1 ? 2 : 1;

        if (gameStatus.value === "playing" && isCurrentPlayerAI()) {
          triggerAIMove(async () => {
            const aiCol = await computeAiMove();
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
      triggerAIMove(async () => {
        const aiCol = await computeAiMove();
        if (aiCol !== null) fillCol(aiCol);
      });
    }
  };
  const getMoveSequenceFromMoveHistory = () =>{
    console.log('move hestory from the useGame: ',moveHistory);
    
    return moveHistory.value.map(move => move.col.toString()).join('');
  }
  return { fillCol, isColAvailable, getAvailableCol, startGame, getMoveSequenceFromMoveHistory };
}
