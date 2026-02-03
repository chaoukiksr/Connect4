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

            <div v-if="aiMode == 'minimax'" class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <label class="block text-xs text-gray-500 mb-2">IA thinking progress: <span
                     class="font-bold text-emerald-500">{{ aiThinkingProgress }}%</span></label>
               <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                     class="h-full bg-emerald-400 rounded-full transition-all duration-150 ease-out"
                     :style="{ width: `${aiThinkingProgress}%` }"
                  ></div>
               </div>
               <div class="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span>
                  <span>100%</span>
               </div>
            </div>
         </div>
        
      </div>
   </main>
   <QuitModal :isOpen="showQuitModal" @cancel="showQuitModal = false" @quit="quitWithoutSaving" @save-quit="quitAndSave"/>
</template>

<script setup>
import { ref } from 'vue';
import Navbar from '../components/Navbar.vue'
import { useAi } from '../composables/useAi';
const {savedGameToDatabase} = useApi();
import { useGameStateStore } from '../stores/gameState';
import { useGameSettingsStore } from '../stores/gameSettings';
import { storeToRefs } from 'pinia'
import Board from '../components/Board.vue';
import { useFileManagement } from '../composables/useFileManagement'
import { useGame } from '../composables/useGame'
import QuitModal from '../components/QuitModal.vue';
import { useRouter } from 'vue-router';
import { useApi } from '../composables/useApi';
const router = useRouter()
const { download,save } = useFileManagement()
const { startGame } = useGame()
const gameSettingsStore = useGameSettingsStore();
const gameStateStore = useGameStateStore();
let showQuitModal = ref(false);
// State (reactive refs)
const { aiDepth, aiMode, boardSize, gameMode, startingPlayer } = storeToRefs(gameSettingsStore)
const { board, currentPlayer, gameStatus, winner, moveHistory, historyIndex, aiThinkingProgress } = storeToRefs(gameStateStore)

// Actions (functions) - don't use storeToRefs for these
const { resetGame, setCurrentPlayer, setGameStatus, setWinner, undo, redo } = gameStateStore



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
      // If first player is AI, start AI move
      startGame();
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
   download()
}

const saveGame = async ()=>{
   save()
   const {ok,data} = await savedGameToDatabase();
   if(ok){
      console.log('Saved!', data);
   }else{
      console.error('Error: ', data.error);
      
   }
}
const quitGame = () =>{
   //show modal for eather save and quite, quit without saving, and cancel the quit operation
   showQuitModal.value = true
      quit();
}
const quitWithoutSaving = () => {
   router.push('/')
}
const quitAndSave = () =>{
   saveGame();
   router.push('/')
}
</script>
