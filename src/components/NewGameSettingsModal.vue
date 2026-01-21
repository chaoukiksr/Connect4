<template>
   <!-- Modal Overlay (Background) -->
   <div class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"></div>

   <!-- Modal Container -->
   <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 border border-gray-100">

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
         <h2 class="text-3xl font-bold text-gray-800">⚙️ Paramètres de la partie</h2>
         <button class="text-gray-400 hover:text-gray-600 text-3xl font-bold transition-colors" @click="closeModal">
            ✕
         </button>
      </div>

      <!-- Form Content -->
      <div class="space-y-6">

         <!-- Game Mode Selection -->
         <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">Mode de jeu</label>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

               <!-- 0 Players -->
               <button @click="formData.gameMode = 0"
                  :class="formData.gameMode === 0 ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md' : 'bg-white hover:bg-emerald-50 border-2 border-gray-300 hover:border-emerald-500'"
                  class=" rounded-xl p-4 transition-all">
                  <div class="text-2xl mb-2">🤖</div>
                  <div class="font-bold text-gray-800">0 Joueurs</div>
                  <div class="text-xs text-gray-500 mt-1">IA vs IA</div>
               </button>

               <!-- 1 Player -->
               <button @click="formData.gameMode = 1"
                  :class="formData.gameMode === 1 ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md' : 'bg-white hover:bg-emerald-50 border-2 border-gray-300 hover:border-emerald-500'"
                  class=" rounded-xl p-4 transition-all">
                  <div class="text-2xl mb-2">👤</div>
                  <div class="font-bold text-gray-800">1 Joueur</div>
                  <div class="text-xs text-gray-500 mt-1">vs IA</div>
               </button>

               <!-- 2 Players -->
               <button @click="formData.gameMode = 2"
                  :class="formData.gameMode === 2 ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md' : 'bg-white hover:bg-emerald-50 border-2 border-gray-300 hover:border-emerald-500'"
                  class=" rounded-xl p-4 transition-all">
                  <div class="text-2xl mb-2">👥</div>
                  <div class="font-bold text-gray-800">2 Joueurs</div>
                  <div class="text-xs text-gray-500 mt-1">Local</div>
               </button>

            </div>
         </div>

         <!-- Board Size -->
         <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">Taille du plateau</label>
            <div class="grid grid-cols-2 gap-4">

               <!-- Rows -->
               <div>
                  <label class="block text-xs text-gray-500 mb-2">Lignes</label>
                  <input v-model="formData.rows" type="number" value="8" min="4" max="12"
                     class="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold text-gray-800 focus:border-emerald-500 focus:outline-none transition-colors">
               </div>

               <!-- Columns -->
               <div>
                  <label class="block text-xs text-gray-500 mb-2">Colonnes</label>
                  <input v-model="formData.columns" type="number" value="9" min="4" max="12"
                     class="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold text-gray-800 focus:border-emerald-500 focus:outline-none transition-colors">
               </div>

            </div>
         </div>

         <!-- Starting Player -->
         <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">Joueur qui commence</label>
            <div class="grid grid-cols-2 gap-3">

               <!-- Red -->
               <button @click="formData.startingPlayer = 'red'"
                  :class="formData.startingPlayer === 'red' ? 'bg-red-50 border-2 border-red-500' : 'bg-white hover:bg-red-50 border-2 border-gray-300 hover:border-red-500'"
                  class="rounded-xl p-4 transition-all">

                  <div class="text-2xl mb-2">🔴</div>
                  <div class="font-bold text-gray-800">Rouge</div>
               </button>

               <!-- Yellow -->
               <button @click="formData.startingPlayer = 'yellow'"
                  :class="formData.startingPlayer === 'yellow' ? 'bg-yellow-50 border-2 border-yellow-500 shadow-md' : 'bg-white hover:bg-yellow-50 border-2 border-gray-300 hover:border-yellow-500'"
                  class="rounded-xl p-4 transition-all">
                  <div class="text-2xl mb-2">🟡</div>
                  <div class="font-bold text-gray-800">Jaune</div>
               </button>

            </div>
         </div>

         <!-- AI Settings (shown only if AI is playing) -->
         <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <label class="block text-sm font-semibold text-gray-700 mb-3">Paramètres IA</label>

            <!-- AI Mode -->
            <div class="mb-4">
               <label class="block text-xs text-gray-500 mb-2">Mode IA</label>
               <div class="flex gap-2">
                  <button @click="formData.aiMode = 'random'"
                     :class="formData.aiMode === 'random' ? 'bg-emerald-50 border-2 border-emerald-500 shadow-sm' : 'bg-white border-2 border-gray-300 hover:border-emerald-500'"
                     class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
                     Aléatoire
                  </button>
                  <button @click="formData.aiMode = 'minimax'"
                     :class="formData.aiMode === 'minimax' ? 'bg-emerald-50 border-2 border-emerald-500 shadow-sm' : 'bg-white border-2 border-gray-300 hover:border-emerald-500'"
                     class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
                     Minimax
                  </button>
               </div>
            </div>

            <!-- Depth Slider -->
            <div>
               <label class="block text-xs text-gray-500 mb-2">Profondeur: <span
                     class="font-bold text-emerald-600">5</span></label>
               <input v-model="formData.aiDepth" type="range" min="1" max="10" value="5"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500">
               <div class="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Facile (1)</span>
                  <span>Difficile (10)</span>
               </div>
            </div>
         </div>

      </div>

      <!-- Footer Buttons -->
      <div class="flex gap-3 mt-8">
         <button
            class="flex-1 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 font-bold text-lg py-4 px-6 rounded-xl transition-all"
            @click="cancelGame">
            Annuler
         </button>
         <button @click="startGame"
            class="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg transition-all hover:-translate-y-0.5">
            🎮 Démarrer
         </button>
      </div>

   </div>
</template>

<script setup>
import { reactive, useModel } from 'vue';
   const props = defineProps({
      modelValue:{
         type:Boolean,
         default: false
      }
   })
   const emit = defineEmits(['update:modelValue','submit']);
   const formData = reactive({
      gameMode: 1, //default (number, not string)
      startingPlayer:'red',
      rows:8, //default
      columns:9,//default
      aiMode:'minimax',
      aiDepth:5
   })
   const isOpen = useModel(props,'modelValue')
   const closeModal = () =>{
      isOpen.value = false;
   }
   const cancelGame = () =>{
      closeModal();
   }

   const startGame = () => {
   //data validation
   
   
   if (formData.rows < 4 || formData.columns < 4) {
      console.log("la grille doit avoir au moin 4 ligne et 4 column");
      alert('la grille doit avoir au moin 4 ligne et 4 column')
      return;
   }
   emit('submit', { ...formData });
   closeModal();

}
</script>