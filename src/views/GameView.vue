<template>
   <Navbar />
   <main class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

         <!-- Left Side: Game Board -->
         <div class="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">

            <!-- Game Status -->
            <div class="text-center mb-6">
               <h2 class="text-3xl font-bold text-gray-800">
                  Tour: <span v-if="currentPlayer == 1" class="text-red-500">Red</span>
                  <span v-else class="text-yellow-500">yellow</span>
               </h2>
            </div>

            <!-- Game Board Frame -->
            <Board :board="board" , :boardSize="boardSize" />

            <!-- History Controls Below Board -->
            <div class="flex items-center justify-center gap-6">
               <button @click="undoMove"
                  class="text-red-500 hover:text-red-600 font-bold text-2xl transition-colors hover:-translate-y-0.5">
                  Undo
               </button>
               <span class="text-gray-300 text-2xl">|</span>
               <button @click="redoMove"
                  class="text-emerald-500 hover:text-emerald-600 font-bold text-2xl transition-colors hover:-translate-y-0.5">
                  redo
               </button>
            </div>

         </div>

         <!-- Right Side: Controls Panel -->
         <div class="space-y-4">


            <!-- Actions Card -->
            <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
               <div class="space-y-4">

                  <!-- Start/Pause/Play -->
                  <button @click="toggleGameStatus"
                     class="w-full text-left text-emerald-500 hover:text-emerald-600 font-bold text-xl transition-all hover:translate-x-1">
                     {{ gameStatus === 'start' ? 'START' : gameStatus === 'playing' ? 'PAUSE' : 'PLAY' }}
                  </button>

                  <div class="border-t border-gray-100"></div>

                  <!-- Restart -->
                  <button @click="restartGame"
                     class="w-full text-left text-gray-800 hover:text-gray-900 font-bold text-xl transition-all hover:translate-x-1">
                     Restart
                  </button>

                  <div class="border-t border-gray-100"></div>

                  <!-- Download -->
                  <button @click="downloadGame"
                     class="w-full text-left text-yellow-600 hover:text-yellow-700 font-bold text-xl transition-all hover:translate-x-1">
                     Download
                  </button>

                  <div class="border-t border-gray-100"></div>

                  <!-- Save -->
                  <button @click="saveGame"
                     class="w-full text-left text-yellow-600 hover:text-yellow-700 font-bold text-xl transition-all hover:translate-x-1">
                     Save the game for later
                  </button>

                  <div class="border-t border-gray-100"></div>

                  <!-- Quit -->
                  <button @click="quitGame"
                     class="w-full text-left text-red-500 hover:text-red-600 font-bold text-xl transition-all hover:translate-x-1">
                     Quit
                  </button>

               </div>
            </div>

         </div>

      </div>
   </main>
</template>

<script setup>
import Navbar from '../components/Navbar.vue'
import { useGameStateStore } from '../stores/gameState';
import { useGameSettingsStore } from '../stores/gameSettings';
import { storeToRefs } from 'pinia'
import Board from '../components/Board.vue';


const gameSettingsStore = useGameSettingsStore();
const gameStateStore = useGameStateStore();

// State (reactive refs)
const { aiDepth, aiMode, boardSize, gameMode, startingPlayer } = storeToRefs(gameSettingsStore)
const { board, currentPlayer, gameStatus, winner,moveHistory,historyIndex } = storeToRefs(gameStateStore)

// Actions (functions) - don't use storeToRefs for these
const { resetGame, setCurrentPlayer, setGameStatus, setWinner,undo,redo } = gameStateStore



const undoMove = () =>{
   undo();
   console.log('undoing');
   
}
const redoMove = () =>{
   redo();
   console.log('redoing');
   
}

const toggleGameStatus = () => {
   if (gameStatus.value === 'start') {
      gameStatus.value = 'playing'
   } else if (gameStatus.value === 'playing') {
      gameStatus.value = 'paused'
   } else {
      gameStatus.value = 'playing'
   }
}

const restartGame = () => {
   resetGame();
}
const downloadGame = () =>{
   const data = {
      "gameStatus": gameStatus.value,
      "currentPlayer": currentPlayer.value,
      "winner": winner.value,
      "board": board.value,
      "history":moveHistory.value,
      "historyIndex":historyIndex.value,
      "aiDepth":aiDepth.value,
      "aiMode": aiMode.value,
      "boardSize": boardSize.value,
      "gameMode": gameMode.value,
      "startingPlayer": startingPlayer.value
   }

   const json = JSON.stringify(data, null, 2);
   const blob = new Blob([json], { type: 'application/json' })

   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = "connect4Game.json";
   a.click();

   URL.revokeObjectURL(url);
}
</script>