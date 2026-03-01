<template>
   <div @click="$emit('load', game.id)"
      class="bg-slate-800 border border-slate-700 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-emerald-500/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/20">

      <div class="flex items-center justify-between mb-4">
         <span class="text-2xl">{{ game.gameStatus === 'finished' ? '🏆' : '🎲' }}</span>
         <span
            :class="game.gameStatus === 'finished'
               ? 'text-yellow-400 bg-yellow-900/40 border border-yellow-700/30'
               : 'text-emerald-400 bg-emerald-900/40 border border-emerald-700/30'"
            class="text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {{ game.gameStatus === 'finished' ? 'Terminée' : 'En cours' }}
         </span>
      </div>

      <h3 class="text-sm font-bold text-slate-200 mb-2 truncate">{{ game.id }}</h3>

      <p class="text-xs text-slate-400 mb-1">
         {{ getGameModeText(game.gameMode) }}
      </p>

      <p class="text-xs text-slate-600">{{ formatDate(game.id) }}</p>

      <button @click.stop="$emit('delete', game.id)"
         class="mt-4 text-xs text-red-500 hover:text-red-400 transition-colors font-medium">
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
