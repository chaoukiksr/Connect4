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
  const { getBestMove, getBestMoveAsync } = useMinimax();
  const { getBestMoveAsync: getMlMoveAsync } = useMlAi();

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
            setAiThinkingProgress(0);
            let aiCol;
            if (aiMode.value === 'ml') {
              try {
                aiCol = await getMlMoveAsync(board.value, currentPlayer.value, mlSimulations.value, (progress) => {
                  setAiThinkingProgress(progress);
                });
              } catch (err) {
                addLog(`⚠ ML indisponible (${err.message}). Bascule sur Minimax.`);
                aiCol = await getBestMoveAsync(board.value, aiDepth.value, (progress) => {
                  setAiThinkingProgress(progress);
                });
              }
            } else {
              aiCol = await getBestMoveAsync(board.value, aiDepth.value, (progress) => {
                setAiThinkingProgress(progress);
              });
            }
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
        setAiThinkingProgress(0);
        let aiCol;
        if (aiMode.value === 'ml') {
          try {
            aiCol = await getMlMoveAsync(board.value, currentPlayer.value, mlSimulations.value, (progress) => {
              setAiThinkingProgress(progress);
            });
          } catch (err) {
            addLog(`⚠ ML indisponible (${err.message}). Bascule sur Minimax.`);
            aiCol = await getBestMoveAsync(board.value, aiDepth.value, (progress) => {
              setAiThinkingProgress(progress);
            });
          }
        } else {
          aiCol = await getBestMoveAsync(board.value, aiDepth.value, (progress) => {
            setAiThinkingProgress(progress);
          });
        }
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
