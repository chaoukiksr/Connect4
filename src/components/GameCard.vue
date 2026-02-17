<template>
   <div class="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      
      <!-- Header: ID + Status -->
      <div class="flex justify-between items-center mb-3">
         <span class="text-lg font-bold text-gray-700">#{{ game.id }}</span>
         <span 
            :class="[
               'px-2 py-1 rounded-full text-xs font-bold',
               game.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            ]"
         >
            {{ game.status === 'completed' ? 'Terminée' : 'En cours' }}
         </span>
      </div>

      <!-- Mini Board Preview -->
      <div class="flex justify-center mb-3">
         <div 
            class="inline-grid gap-0.5 bg-blue-600 p-1.5 rounded-lg"
            :style="{ gridTemplateColumns: `repeat(${game.board_cols}, 1fr)` }"
         >
            <div 
               v-for="(cell, index) in boardPreview" 
               :key="index"
               class="w-3 h-3 rounded-full"
               :class="{
                  'bg-white': cell === 0,
                  'bg-red-500': cell === 1,
                  'bg-yellow-400': cell === 2
               }"
            ></div>
         </div>
      </div>

      <!-- Info -->
      <div class="space-y-2 text-sm">
         <!-- Moves -->
         <div class="flex justify-between">
            <span class="text-gray-500">Coups</span>
            <span class="font-mono font-bold">{{ game.total_moves }}</span>
         </div>

         <!-- Result -->
         <div class="flex justify-between">
            <span class="text-gray-500">Résultat</span>
            <span :class="resultClass">{{ resultText }}</span>
         </div>

         <!-- Symmetric -->
         <div v-if="game.symmetric_game_id" class="flex justify-between">
            <span class="text-gray-500">Symétrique</span>
            <span class="text-purple-600 font-bold">#{{ game.symmetric_game_id }}</span>
         </div>

         <!-- Sequence (truncated) -->
         <div class="flex justify-between">
            <span class="text-gray-500">Séquence</span>
            <span class="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">
               {{ truncatedSequence }}
            </span>
         </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 mt-4">
         <button 
            @click="$emit('view', game)"
            class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-bold transition-colors"
         >
            👁️ Voir
         </button>
         <button 
            @click="$emit('delete', game.id)"
            class="bg-red-100 hover:bg-red-200 text-red-600 py-2 px-3 rounded-lg text-sm font-bold transition-colors"
         >
            🗑️
         </button>
      </div>
   </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
   game: {
      type: Object,
      required: true
   }
});

defineEmits(['view', 'delete']);

// No move_sequence or board size available, so just show a placeholder preview
const boardPreview = computed(() => {
   // Default to 6x7 empty board
   const rows = 6, cols = 7;
   return Array(rows * cols).fill(0);
});

// Result display
const resultText = computed(() => {
   const map = {
      'player1_wins': '🔴 Rouge',
      'player2_wins': '🟡 Jaune',
      'draw': '🤝 Nul'
   };
   return map[props.game.result] || '-';
});

const resultClass = computed(() => {
   const map = {
      'player1_wins': 'text-red-600 font-bold',
      'player2_wins': 'text-yellow-600 font-bold',
      'draw': 'text-gray-600 font-bold'
   };
   return map[props.game.result] || 'text-gray-400';
});

// Truncate signature
const truncatedSignature = computed(() => {
   const seq = props.game.signature || '';
   return seq.length > 10 ? seq.slice(0, 10) + '...' : seq;
});
</script>
