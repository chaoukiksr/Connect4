<template>
   <div @click="$emit('load', game.id)"
      class="bg-white rounded-xl p-8 cursor-pointer shadow-lg border border-gray-100 hover:border-emerald-400 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl">

      <div class="flex items-center justify-between mb-4">
         <span class="text-3xl">{{ game.gameStatus === 'finished' ? '🏆' : '🎲' }}</span>
         <span
            :class="game.gameStatus === 'finished' ? 'text-yellow-600 bg-yellow-50' : 'text-emerald-600 bg-emerald-50'"
            class="text-xs font-semibold px-3 py-1 rounded-full">
            {{ game.gameStatus === 'finished' ? 'Terminée' : 'En cours' }}
         </span>
      </div>

      <h3 class="text-xl font-bold text-gray-800 mb-2">{{ game.id }}</h3>

      <p class="text-sm text-gray-500 mb-1">
         {{ getGameModeText(game.gameMode) }}
      </p>

      <p class="text-xs text-gray-400">{{ formatDate(game.id) }}</p>

      <button @click.stop="$emit('delete', game.id)" class="mt-2 text-xs text-red-500 hover:text-red-700">
         🗑️ Supprimer
      </button>
   </div>
</template>

<script setup>
const props = defineProps({
   game: {
      type: Object,
      required: true
   }
});
console.log(props.game);

defineEmits(['load', 'delete']);

const getGameModeText = (mode) => {
   if (mode === 0) return '🤖 IA vs 🤖 IA';
   if (mode === 1) return '👤 Player vs 🤖 IA';
   return '👤 Player vs 👤 Player';
};

const formatDate = (timestamp) => {
   const date = new Date(timestamp);
   const now = new Date();
   const diffTime = Math.abs(now - date);
   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

   if (diffDays === 0) {
      return "Aujourd'hui, " + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
   } else if (diffDays === 1) {
      return "Hier, " + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
   } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ', ' +
         date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
   }
};
</script>
