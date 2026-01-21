import { defineStore} from 'pinia'
import { ref } from 'vue'

export const useGameStateStore = defineStore('gameState', () => {
   const gameStatus = ref('paused')
   const winner = ref(null)
   const currentPlayer = ref(1);
   const board = ref(Array(boardSize.value.rows).fill().map(() => Array(boardSize.value.cols).fill(0)))
   const setCurrentPlayer = (player) => {
      currentPlayer.value = player;
   }
   const setGameStatus = (status) => {
      gameStatus.value = status;
   }
   const setWinner = (player) => {
      winner.value = player
   }

   const resetGame = () => {
      currentPlayer.value = 1;
      gameStatus.value = 'paused'
      winner.value = null
   }
   return {
      currentPlayer,
      winner,
      gameStatus,
      board,
      setCurrentPlayer,
      setGameStatus,
      setWinner,
      resetGame
   }
})