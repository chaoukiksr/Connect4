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
            <div class="grid grid-cols-3 gap-4 mb-6">
               <div class="bg-gray-50 rounded-xl p-4 text-center">
                  <p class="text-3xl font-bold text-emerald-600">0</p>
                  <p class="text-gray-600">Parties</p>
               </div>
               <div class="bg-gray-50 rounded-xl p-4 text-center">
                  <p class="text-3xl font-bold text-blue-600">0</p>
                  <p class="text-gray-600">Terminées</p>
               </div>
               <div class="bg-gray-50 rounded-xl p-4 text-center">
                  <p class="text-3xl font-bold text-amber-600">0</p>
                  <p class="text-gray-600">Symétriques</p>
               </div>
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

   </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Navbar from '../components/Navbar.vue';
import { useApi } from '../composables/useApi';
import GameCard from '../components/GameCard.vue';
const { fetchGames } = useApi();

//fetch db games
const games = ref([]);
onMounted(async ()=>{
   
   games.value = await fetchGames();
   console.log(games.value);
})
</script>
