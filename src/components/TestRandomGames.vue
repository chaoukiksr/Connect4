<template>
  <div class="hidden"></div> <!-- pas besoin d'affichage -->
</template>

<script setup>
import { onMounted } from 'vue';
import { useRandomGames } from '../composables/useRandomGames';

const { generateMultipleGames } = useRandomGames();

onMounted(() => {
  generateMultipleGames(50); // Génère 50 parties aléatoires au chargement
});
</script>
