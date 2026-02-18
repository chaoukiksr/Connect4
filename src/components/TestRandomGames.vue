<template>
  <div class="hidden"></div> <!-- pas besoin d'affichage -->
</template>

<script setup>
import { onMounted } from 'vue';
import { useRandomGames } from '../composables/useRandomGames';
import { insertAllLocalGames } from '../composables/insertAllLocalGames';
const { generateMultipleGames } = useRandomGames();

onMounted(async () => {
  generateMultipleGames(50); // Génère 50 parties aléatoires au chargement
  console.log('Random games generated. Starting DB insert...');
  let successCount = 0;
  const games = JSON.parse(localStorage.getItem('games')) || [];
  for (const [i, game] of games.entries()) {
    const signature = game.history ? game.history.join('') : '';
    
    // Convert starting player and winner to character format (R for red/1, Y for yellow/2)
    const convertPlayer = (player) => {
      if (player === 1 || player === '1' || player?.toLowerCase?.() === 'red' || player === 'R') return 'R';
      if (player === 2 || player === '2' || player?.toLowerCase?.() === 'yellow' || player === 'Y') return 'Y';
      return null;
    };

    const body = {
      signature: signature,
      startingPlayer: convertPlayer(game.startingPlayer),
      mode: 'BGA',
      type_partie: 'random',
      status: 'finished',
      winner: game.winner ? convertPlayer(game.winner) : null,
      ligne_gagnante: null
    };
    try {
      const response = await fetch('http://localhost:3000/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        successCount++;
        console.log(`Game ${i+1}/${games.length} inserted successfully.`);
      } else {
        const error = await response.text();
        console.log(`Game ${i+1}/${games.length} failed: ${error}`);
      }
    } catch (e) {
      console.log(`Game ${i+1}/${games.length} error: ${e}`);
    }
  }
  console.log(`Insertion complete. ${successCount} games inserted out of ${games.length}.`);
});
</script>
