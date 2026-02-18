// insertAllLocalGames.js
// Run this in the browser console or as a Vue method to insert all locally saved games into the database
import { useApi } from './useApi.js';

export async function insertAllLocalGames() {
  const { savedGameToDatabase } = useApi();
  const games = JSON.parse(localStorage.getItem('games')) || [];
  let successCount = 0;
  for (const game of games) {
    // Map local game fields to API fields
    const body = {
      moveSequence: game.history ? game.history.join('') : '',
      mode: 'BGA',
      gameMode: game.gameMode,
      gameStatus: game.gameStatus,
      startingPlayer: game.startingPlayer,
      winner: game.winner,
      winningCells: JSON.stringify([]), // or extract from game if available
    };
    try {
      const response = await fetch('http://localhost:3000/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.ok) successCount++;
    } catch (e) {
      // ignore errors for now
    }
  }
  return successCount;
}