// generateRandomGames.js
import fetch from 'node-fetch'; // si Node 18+, tu peux utiliser fetch directement
import { useRandomGames } from './src/composables/useRandomGames.js'; // chemin vers ton composable

const API_URL = 'http://localhost:3000/api/games'; // ton endpoint API

async function main() {
  const { generateMultipleGames } = useRandomGames();

  // Générer 50 parties aléatoires
  const games = generateMultipleGames(50);

  // Envoyer chaque partie à l'API
  for (const game of games) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      });
      const data = await response.json();
      console.log('Partie sauvegardée :', data);
    } catch (err) {
      console.error('Erreur lors de l\'envoi d\'une partie :', err);
    }
  }

  console.log('Toutes les parties aléatoires ont été générées et envoyées !');
}

main();
