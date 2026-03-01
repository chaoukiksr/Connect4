<template>
<Navbar/>
  <main class="min-h-screen bg-slate-900 px-4 py-12">

      <!-- Hero -->
      <div class="text-center mb-12">
         <h2 class="text-5xl font-extrabold mb-3">
            <span class="text-red-500">C</span><span class="text-yellow-400">O</span><span class="text-red-500">N</span><span class="text-yellow-400">N</span><span class="text-red-500">E</span><span class="text-yellow-400">C</span><span class="text-red-500">T</span><span class="text-white"> 4</span>
         </h2>
         <p class="text-slate-400 text-lg">Alignez 4 pions et gagnez !</p>
      </div>

      <!-- Actions Section -->
      <section class="max-w-md mx-auto mb-16">
         <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-4">

            <!-- Start New Game Button -->
            <button @click="()=>{isModalOpen = !isModalOpen; console.log('modal toggled')}"
               class="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xl py-4 px-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-emerald-500/30">
                  🎮 Nouvelle Partie
            </button>

            <!-- Load Game Button -->
            <label
               class="w-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 font-bold text-xl py-4 px-8 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
                  📂 Charger une partie
               <input type="file" accept=".json" @change="(e) => upload(e, () => router.push('/game'))" class="hidden" />
            </label>

            <!-- BGA Button -->
            <button
               @click="router.push('/bga')"
               class="w-full bg-linear-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold text-xl py-4 px-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sky-500/30">
               🔍 Rejouer une partie BGA
            </button>

            <!-- Database Button (admin only) -->
            <button
               v-if="isAdmin"
               @click="router.push('/database')"
               class="w-full bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-xl py-4 px-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-purple-500/30">
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
   const isAdmin = ref(false);
   onMounted(()=>{
      const storedGames = localStorage.getItem('games');
      games.value = storedGames ? JSON.parse(storedGames) : [];
      isAdmin.value = localStorage.getItem('role') === 'admin';
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