<template>
   <section class="max-w-5xl mx-auto">

      <!-- Section Title -->
      <div class="mb-8">
         <h2 class="text-2xl font-bold text-white mb-1">Parties sauvegardées</h2>
         <div class="w-16 h-0.5 bg-linear-to-r from-emerald-500 to-transparent rounded-full"></div>
      </div>

      <!-- Saved Games Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

         <!-- Game Cards -->
         <SavedGameCard v-for="game in games" :key="game.id" :game="game" @load="$emit('load-game', $event)"
            @delete="$emit('delete-game', $event)" />

         <!-- No games message -->
         <div v-if="games.length === 0" class="col-span-full text-center py-16">
            <p class="text-4xl mb-4">🎮</p>
            <p class="text-slate-400 text-base">Aucune partie sauvegardée</p>
            <p class="text-slate-600 text-sm mt-1">Commencez une nouvelle partie et sauvegardez-la !</p>
         </div>

      </div>
   </section>
</template>

<script setup>
import { computed } from 'vue';
import SavedGameCard from './SavedGameCard.vue';

const props = defineProps({
   games: {
      type: Array,
      required: true,
      default: () => []
   }
});

// Filter out null/undefined games


defineEmits(['load-game', 'delete-game']);
</script>
