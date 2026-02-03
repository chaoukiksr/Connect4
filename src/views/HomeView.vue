<template>
<Navbar/>
  <main class="container mx-auto px-4 py-12">

      <!-- Actions Section -->
      <section class="max-w-lg mx-auto mb-16">
         <div class="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">

            <!-- Start New Game Button -->
            <button @click="()=>{isModalOpen = !isModalOpen ;startANewGame; console.log('modal toggled')}"
               class="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-2xl py-5 px-8 rounded-xl mb-4 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-emerald-500/40">
               🎮 Nouvelle Partie
            </button>

            <!-- Load Game Button -->
            <label
               class="w-full block text-center bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 font-bold text-2xl py-5 px-8 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer mb-4">
               📂 Charger une partie
               <input type="file" accept=".json" @change="(e) => upload(e, () => router.push('/game'))" class="hidden" />
            </label>

            <!-- Database Button -->
            <button 
               @click="router.push('/database')"
               class="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold text-2xl py-5 px-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-purple-500/40">
               🗄️ Gérer la base de données
            </button>

            <NewGameSettingsModal v-if="isModalOpen" v-model="isModalOpen" @submit="startANewGame"/>
         </div>
      </section>
      <SavedGameList :games="games" @load-game="loadGame" @delete-game="deleteGame" />
      </main>
</template>

<script setup>
   import {useRouter} from 'vue-router'
   const router = useRouter();
   import SavedGameList from '../components/SavedGamesList.vue'
   import Navbar from '../components/Navbar.vue'
   import NewGameSettingsModal from '../components/NewGameSettingsModal.vue';
   import { onMounted, ref } from 'vue';
   const games = ref([])
   onMounted(()=>{
      const storedGames = localStorage.getItem('games');
      games.value = storedGames ? JSON.parse(storedGames) : [];
      console.log(games.value);
      
   })

   import {useGameSettingsStore} from '../stores/gameSettings'
   import {useFileManagement} from '../composables/useFileManagement'
import { storeToRefs } from 'pinia';
   import { useGameStateStore } from '../stores/gameState';
   import { useAi } from '../composables/useAi';
   const gameSettings = useGameSettingsStore();
   const gameState = useGameStateStore();
   const {boardSize,aiDepth,aiMode,gameMode,startingPlayer} = storeToRefs(gameSettings)
   const {upload} = useFileManagement()
   const {setSettings,setAiDepth,setAiMode,setBoardSize,setGameMode,setStartingPlayer} = useGameSettingsStore();
   const { resetGame } = gameState;
   const isModalOpen = ref(false);

   const loadGame = (gameId) => {
      const savedGames = JSON.parse(localStorage.getItem('games')) || [];
      const game = savedGames.find(g => g && g.id === gameId);
      if (game) {
         // Load game state
         gameState.gameStatus = game.gameStatus;
         gameState.currentPlayer = game.currentPlayer;
         gameState.winner = game.winner;
         gameState.board = game.board;
         gameState.moveHistory = game.history;
         gameState.historyIndex = game.historyIndex;
         
         // Load game settings
         setSettings({
            gameMode: game.gameMode,
            startingPlayer: game.startingPlayer,
            boardSize: game.boardSize,
            aiMode: game.aiMode,
            aiDepth: game.aiDepth
         });
         
         router.push('/game');
      }
   };

   const deleteGame = (gameId) => {
      const savedGames = JSON.parse(localStorage.getItem('games')) || [];
      const updatedGames = savedGames.filter(g => g && g.id !== gameId);
      localStorage.setItem('games', JSON.stringify(updatedGames));
      games.value = updatedGames;
   };

   const startANewGame = (data) =>{
      console.log('data recieved from the modal',data);
      setSettings({
         gameMode:data.gameMode,
         startingPlayer:data.startingPlayer,
         boardSize:{rows:data.rows, cols:data.columns},
         aiMode:data.aiMode,
         aiDepth:data.aiDepth
      })
      
      // Recreate the board with new dimensions
      resetGame();
      console.log('store boardSize', boardSize.value);
      
      console.log('settings are setted');
      
      router.push('/game');
      console.log('starting a new game');
      
   }
</script>