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
  const { addMove, setAiThinkingProgress } = gameStateStore;
  const {moveHistory} = storeToRefs(gameStateStore);
  const { checkProbableWin } = useWinCheck();
  const { getBestMove, getBestMoveAsync } = useMinimax(); // <- on récupère la fonction

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
//Parcourt la colonne de bas en haut.
    for (let r = boardSize.value.rows - 1; r >= 0; r--) {
      //Place le pion.
      if (board.value[r][col] === 0) {
        board.value[r][col] = currentPlayer.value;
        //ajout le coup a lhistorique
        addMove(r, col, currentPlayer.value);
        checkProbableWin(r, col, currentPlayer.value);
//Change de joueur.
        currentPlayer.value = currentPlayer.value === 1 ? 2 : 1;
//si cest le tour de l'AI
        if (gameStatus.value === "playing" && isCurrentPlayerAI()) {
          triggerAIMove(async () => {
            setAiThinkingProgress(0);
            //Calcule la meilleure colonne avec Minimax.
            const aiCol = await getBestMoveAsync(board.value, aiDepth.value, (progress) => {
              setAiThinkingProgress(progress);
            });
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
        const aiCol = await getBestMoveAsync(board.value, aiDepth.value, (progress) => {
          setAiThinkingProgress(progress);
        });
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
