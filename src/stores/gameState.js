import { defineStore, storeToRefs} from 'pinia'
import { ref } from 'vue'
import {useGameSettingsStore} from './gameSettings'
export const useGameStateStore = defineStore('gameState', () => {
   const gameSettings = useGameSettingsStore();
   const {boardSize} = storeToRefs(gameSettings);
   const gameStatus = ref('start')
   const winner = ref(null)
   const currentPlayer = ref(1);
   const board = ref(Array(boardSize.value.rows
   ).fill().map(() => Array(boardSize.value.cols).fill(0)))
   
   const moveHistory = ref([]);
   const historyIndex = ref(-1)

   const addMove = (row, col, player) =>{
      moveHistory.value.push({row,col,player});
      historyIndex.value++
   }

   const undo = () =>{
      if(historyIndex.value < 0)  return false;
      const move = moveHistory.value[historyIndex.value];
      board.value[move.row][move.col] = 0;
      currentPlayer.value = move.player;
      historyIndex.value--;
      return true;
   }

   const redo = () =>{
      if(historyIndex.value >=moveHistory.value.length - 1) return false;
      historyIndex.value++;
      const move = moveHistory.value[historyIndex.value];
      board.value[move.row][move.col] = move.player
      currentPlayer.value == 1 ? 2 : 1;
      return true;
   
   }


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
      gameStatus.value = 'start'
      winner.value = null
      board.value = Array(boardSize.value.rows
      ).fill().map(() => Array(boardSize.value.cols).fill(0))
   }
   return {
      gameStatus,
      winner,
      currentPlayer,
      board,
      moveHistory,
      historyIndex,
      setCurrentPlayer,
      setGameStatus,
      setWinner,
      resetGame,
      addMove,
      undo,
      redo
   }
})