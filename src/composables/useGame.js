import { useGameSettingsStore } from "../stores/gameSettings" 
import { useGameStateStore } from "../stores/gameState"
import { storeToRefs } from 'pinia'
import { useWinCheck } from "./useWinCheck";
import { useGameFlow } from './useGameFlow'

export function useGame() {
   const { isCurrentPlayerAI, triggerAIMove, setFillColCallback } = useGameFlow();
   const gameSettingsStore = useGameSettingsStore();
   const gameStateStore = useGameStateStore();
   const { 
      aiDepth,
      aiMode,
      boardSize,
      gameMode,
      startingPlayer
   } = storeToRefs(gameSettingsStore)

   const { 
      board,
      currentPlayer,
      gameStatus,
      winner,
      moveHistory,
      historyIndex
   } = storeToRefs(gameStateStore)

   const { setWinner, resetGame, setCurrentPlayer, setGameStatus, addMove } = gameStateStore;
   const { checkProbableWin } = useWinCheck();

   const isColAvailable = (col) => {
      return board.value[0][col] === 0;
   }

   const getAvailableCol = () => {
      const availableCols = []
      for (let i = 0; i < boardSize.value.cols; i++) {
         if (isColAvailable(i)) {
            availableCols.push(i);
         }
      }
      return availableCols
   }

   const fillCol = (col) => {
      if (gameStatus.value !== "playing") return;
      
      if (getAvailableCol().length === 0) {
         setGameStatus("finished")
         console.log('Board is full, the game is finished');
         return;
      }
      
      if (!isColAvailable(col)) {
         console.log('column is not available');
         return;
      }

    
      for (let i = boardSize.value.rows - 1; i >= 0; i--) {
         if (board.value[i][col] === 0) {
            board.value[i][col] = currentPlayer.value
            addMove(i, col, currentPlayer.value)
            checkProbableWin(i, col, currentPlayer.value) 
            currentPlayer.value = currentPlayer.value === 1 ? 2 : 1;
            console.log('col is filled, current player now:', currentPlayer.value);
            if (gameStatus.value === 'playing' && isCurrentPlayerAI()) {
               triggerAIMove(fillCol);  
            }
            break;
         }
      }
   }


   const startGame = () => {
     
      setFillColCallback(fillCol);
      
      if (isCurrentPlayerAI()) {
         triggerAIMove(fillCol);
      }
   }

   return { fillCol, isColAvailable, getAvailableCol, startGame }
}