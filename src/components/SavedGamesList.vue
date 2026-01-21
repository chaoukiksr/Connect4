<template>
   <section class="max-w-7xl mx-auto">

      <!-- Section Title -->
      <div class="text-center mb-8">
         <h2 class="text-4xl font-bold text-gray-800 mb-2">
            Parties sauvegardées
         </h2>
         <div class="w-24 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 mx-auto rounded-full"></div>
      </div>

      <!-- Saved Games Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

         <!-- Game Cards -->
         <SavedGameCard v-for="game in validGames" :key="game.id" :game="game" @load="$emit('load-game', $event)"
            @delete="$emit('delete-game', $event)" />

         <!-- No games message -->
         <div v-if="validGames.length === 0" class="col-span-full text-center py-12">
            <p class="text-gray-400 text-lg">Aucune partie sauvegardée</p>
            <p class="text-gray-300 text-sm mt-2">Commencez une nouvelle partie et sauvegardez-la !</p>
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
const validGames = computed(() => (props.games|| []).filter(game => game != null));

defineEmits(['load-game', 'delete-game']);
</script>
