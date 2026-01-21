import { useGameStateStore } from "../stores/gameState";
import { useGameSettingsStore } from "../stores/gameSettings";
import { useAi } from './useAi'
import { storeToRefs } from 'pinia'

export function useGameFlow() {
   const { calculateCol } = useAi();

   const gameStateStore = useGameStateStore();
   const gameSettingsStore = useGameSettingsStore();
   const { currentPlayer, gameStatus, board } = storeToRefs(gameStateStore);
   const { gameMode, boardSize } = storeToRefs(gameSettingsStore);
   const { addMove, setGameStatus } = gameStateStore;


   const isCurrentPlayerAI = () => {
      if (gameMode.value === 2) return false; 
      if (gameMode.value === 0) return true;   
      if (gameMode.value === 1) {
         return currentPlayer.value === 2;    
      }
      return false;
   }

   
   const placePiece = (col) => {
      if (gameStatus.value !== 'playing') return false;

      for (let i = boardSize.value.rows - 1; i >= 0; i--) {
         if (board.value[i][col] === 0) {
            board.value[i][col] = currentPlayer.value;
            addMove(i, col, currentPlayer.value);
            return { row: i, col, player: currentPlayer.value };
         }
      }
      return false;
   }

   // Trigger AI move with delay
   const triggerAIMove = (fillColCallback) => {
      if (!isCurrentPlayerAI()) return;
      if (gameStatus.value !== 'playing') return;

      setTimeout(() => {
         const aiCol = calculateCol();
         if (aiCol >= 0) {
            fillColCallback(aiCol);
         }
      }, 750);
   }

   // Start AI vs AI game loop
   const startAIvsAI = (fillColCallback) => {
      if (gameMode.value !== 0) return;
      if (gameStatus.value !== 'playing') return;
      triggerAIMove(fillColCallback);
   }

   return { isCurrentPlayerAI, triggerAIMove, startAIvsAI, placePiece }
}