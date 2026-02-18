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

    // Generate a random sequence of move numbers (0-6 are valid columns)
    const moveCount = Math.floor(Math.random() * 20) + 5; // 5-24 moves
    const moveSequence = [];
    for (let i = 0; i < moveCount; i++) {
      moveSequence.push(Math.floor(Math.random() * 7)); // columns 0-6
    }

    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      gameStatus: 'finished',
      currentPlayer: Math.floor(Math.random() * 2) + 1,
      winner: Math.floor(Math.random() * 2) + 1,
      board,
      history: moveSequence, // Array of move numbers: [0, 1, 2, 0, ...]
      historyIndex: moveSequence.length - 1,
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
    console.log('des parite ont été génerer');
    
  };

  return { generateMultipleGames };
}
