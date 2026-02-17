<template>
   <Navbar />
   <main class="container mx-auto px-4 py-12">
      
      <!-- Header -->
      <section class="max-w-4xl mx-auto mb-8">
         <div class="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div class="flex justify-between items-center mb-6">
               <h1 class="text-3xl font-bold text-gray-800">🗄️ Base de Données</h1>
               <button 
                  class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5"
               >
                  🔄 Rafraîchir
               </button>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
               <State color="emerald" label="Parties" :value="allGames.length" filterType="all" :active="activeFilter === 'all'" @apply-filter="handleApplyFilter" />
               <State color="blue" label="Terminées" :value="allGames.filter(game => game.status !== 'in_progress').length" filterType="completed" :active="activeFilter === 'completed'" @apply-filter="handleApplyFilter" />
               <State color="orange" label="En cours" :value="allGames.filter(game => game.status === 'in_progress').length" filterType="in_progress" :active="activeFilter === 'in_progress'" @apply-filter="handleApplyFilter" />
               <State color="purple" label="Symétriques" :value="allGames.filter(game => game.symmetric_game_id != null).length" filterType="symmetric" :active="activeFilter === 'symmetric'" @apply-filter="handleApplyFilter" />
               <State color="gray" label="Uniques" :value="allGames.filter(game => game.symmetric_game_id == null).length" filterType="unique" :active="activeFilter === 'unique'" @apply-filter="handleApplyFilter" />
            </div>

            <!-- Import Section -->
            <div class="flex gap-4">
               <label class="flex-1 block text-center bg-white hover:bg-gray-50 text-gray-800 border-2 border-dashed border-gray-300 font-bold py-4 px-6 rounded-xl transition-all duration-300 cursor-pointer">
                  📁 Importer un fichier .txt
                  <input type="file" accept=".txt" class="hidden" />
               </label>
            </div>
         </div>
      </section>

      <!-- Games List -->
      <section class="max-w-4xl mx-auto">
         <div class="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">📋 Parties enregistrées</h2>
            <div v-if="games.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               <GameCard v-for="game in games" :key="game.id" :game="game" @view="handleView" @delete="handleDelete" />
            </div>
            <!-- Empty State -->
            <div v-if="games.length == 0" class="text-center py-12">
               <p class="text-6xl mb-4">🎮</p>
               <p class="text-gray-500 text-lg">Aucune partie dans la base de données</p>
               <p class="text-gray-400">Jouez une partie ou importez un fichier</p>
            </div>
         </div>
      </section>

      <!-- Situation Viewer -->
      <section v-if="selectedGame && situations.length" class="max-w-4xl mx-auto mt-8">
         <div class="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <h2 class="text-xl font-bold text-gray-800 mb-4">🔎 Parcourir la partie #{{ selectedGame.id_partie }}</h2>
            <div class="flex flex-col items-center">
               <Board :board="currentBoard" :boardSize="[selectedGame.board_rows || 6, selectedGame.board_cols || 7]" />
               <div class="flex gap-4 mt-4">
                  <button @click="goToPrevSituation" :disabled="!currentSituation || !currentSituation.precedent" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">⬅️ Précédent</button>
                  <span class="font-mono">Coup {{ currentSituation ? currentSituation.numero_coup : '' }}</span>
                  <button @click="goToNextSituation" :disabled="!currentSituation || !currentSituation.suivant" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Suivant ➡️</button>
               </div>
            </div>
         </div>
      </section>
   </main>
</template>

<script setup>
import Board from '../components/Board.vue';
import { useApi } from '../composables/useApi';

const { fetchGames, fetchSituationsByGame } = useApi();

const selectedGame = ref(null);
const situations = ref([]);
const currentSituationIndex = ref(0);

const currentSituation = computed(() => situations.value[currentSituationIndex.value] || null);

const currentBoard = computed(() => {
   if (!currentSituation.value) return [];
   // Plateau is stored as a string, parse to 2D array
   try {
      return JSON.parse(currentSituation.value.plateau);
   } catch {
      return [];
   }
});

const goToPrevSituation = () => {
   if (currentSituation.value && currentSituation.value.precedent != null) {
      const idx = situations.value.findIndex(s => s.id_situation === currentSituation.value.precedent);
      if (idx !== -1) currentSituationIndex.value = idx;
   }
};
const goToNextSituation = () => {
   if (currentSituation.value && currentSituation.value.suivant != null) {
      const idx = situations.value.findIndex(s => s.id_situation === currentSituation.value.suivant);
      if (idx !== -1) currentSituationIndex.value = idx;
   }
};
import { onMounted, ref, computed } from 'vue';
import Navbar from '../components/Navbar.vue';
import GameCard from '../components/GameCard.vue'
import State from '../components/State.vue';


// Store all games (never modified after fetch)
const allGames = ref([]);
const activeFilter = ref('all');

// Computed filtered games based on active filter
const games = computed(() => {
   switch (activeFilter.value) {
      case 'completed':
         return allGames.value.filter(game => game.status !== 'in_progress');
      case 'in_progress':
         return allGames.value.filter(game => game.status === 'in_progress');
      case 'symmetric':
         return allGames.value.filter(game => game.symmetric_game_id != null);
      case 'unique':
         return allGames.value.filter(game => game.symmetric_game_id == null);
      default:
         return allGames.value;
   }
});


onMounted(async () => {
   allGames.value = await fetchGames();
});

const handleView = async (game) => {
   selectedGame.value = game;
   // Fetch situations for this game
   situations.value = await fetchSituationsByGame(game.id_partie);
   // Start at the first situation (numero_coup === 1 or lowest numero_coup)
   let idx = situations.value.findIndex(s => s.numero_coup === 1);
   if (idx === -1) idx = 0;
   currentSituationIndex.value = idx;
};

const handleApplyFilter = (filterType) => {
   activeFilter.value = filterType;
};

const handleDelete = (id) => {
   // TODO: implement delete logic if needed
};
</script>
