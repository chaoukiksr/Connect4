// src/composables/useRandomGames.js
import { useFileManagement } from './useFileManagement';

export function useRandomGames() {
  const { save } = useFileManagement();

  const generateRandomGame = () => {
    // Valeurs aléatoires pour chaque case
    const rows = 6;
    const cols = 7;
    const board = Array(rows).fill().map(() =>
      Array(cols).fill().map(() => Math.floor(Math.random() * 3)) // 0,1,2
    );

    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      gameStatus: 'finished',
      currentPlayer: Math.floor(Math.random() * 2) + 1,
      winner: Math.floor(Math.random() * 2) + 1,
      board,
      history: [],
      historyIndex: -1,
      aiDepth: 5,
      aiMode: 'minimax',
      boardSize: { rows, cols },
      gameMode: Math.floor(Math.random() * 3), // 0,1,2
      startingPlayer: Math.floor(Math.random() * 2) + 1,
    };
  };

  const generateMultipleGames = (n = 10) => {
    for (let i = 0; i < n; i++) {
      const game = generateRandomGame();
      save(game); // sauvegarde dans localStorage
    }
    alert(`${n} parties aléatoires ont été générées !`);
  };

  return { generateMultipleGames };
}
