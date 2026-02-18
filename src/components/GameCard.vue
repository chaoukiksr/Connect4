
<template>
  <div class="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
    <!-- Header: ID + Status -->
    <div class="flex justify-between items-center mb-3">
      <span class="text-lg font-bold text-gray-700">#{{ game.id || game.id_partie || '?' }}</span>
      <span
        :class="[
          'px-2 py-1 rounded-full text-xs font-bold',
          game.status === 'finished' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        ]"
      >
        {{ game.status === 'finished' ? 'Terminée' : 'En cours' }}
      </span>
    </div>

    <!-- Mini Board Preview (placeholder) -->
    <div class="flex justify-center mb-3">
      <div
        class="inline-grid gap-0.5 bg-blue-600 p-1.5 rounded-lg"
        :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }"
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


    <!-- Info: Show all available DB fields -->
    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-500">ID</span>
        <span class="font-mono font-bold">{{ game.id || game.id_partie || '?' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Signature</span>
        <span class="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">{{ truncatedSignature }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Status</span>
        <span>{{ game.status || '-' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Joueur départ</span>
        <span>{{ game.joueur_depart || '-' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Joueur gagnant</span>
        <span>{{ game.joueur_gagnant || '-' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Créée</span>
        <span>{{ game.created_at ? new Date(game.created_at).toLocaleString() : '-' }}</span>
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
        @click="$emit('delete', game.id || game.id_partie)"
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

// Use board size if available, else default to 6x7
const rows = props.game.board_rows || 6;
const cols = props.game.board_cols || 7;
const boardPreview = computed(() => {
  // Placeholder: empty board
  return Array(rows * cols).fill(0);
});

const resultText = computed(() => {
  if (props.game.result === 1) return '🔴 Rouge';
  if (props.game.result === 2) return '🟡 Jaune';
  if (props.game.status === 'draw') return '🤝 Nul';
  return '-';
});

const resultClass = computed(() => {
  if (props.game.result === 1) return 'text-red-600 font-bold';
  if (props.game.result === 2) return 'text-yellow-600 font-bold';
  if (props.game.status === 'draw') return 'text-gray-600 font-bold';
  return 'text-gray-400';
});

const truncatedSignature = computed(() => {
  const seq = props.game.signature || '';
  return seq.length > 10 ? seq.slice(0, 10) + '...' : seq;
});
</script>
