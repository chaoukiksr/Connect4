import { ref } from 'vue';
import { useGameStateStore } from '../stores/gameState';
import { useGameSettingsStore } from '../stores/gameSettings';
import { storeToRefs } from 'pinia';

const API_URL = 'http://localhost:3000';

/**
 * Parse a BGA move signature into structured { row, col, player } move objects.
 * The signature is a string of column indices (0-indexed) separated by nothing.
 * E.g. "3344556" → columns 3,3,4,4,5,5,6
 */
function signatureToMoves(signature, rows, cols) {
  const tempBoard = Array(rows).fill(null).map(() => Array(cols).fill(0));
  const moves = [];
  let player = 1;

  for (const char of signature) {
    const col = parseInt(char, 10);
    if (isNaN(col) || col < 0 || col >= cols) continue;
    // Find the bottom-most empty row
    for (let r = rows - 1; r >= 0; r--) {
      if (tempBoard[r][col] === 0) {
        tempBoard[r][col] = player;
        moves.push({ row: r, col, player });
        break;
      }
    }
    player = player === 1 ? 2 : 1;
  }
  return moves;
}

export function useBga() {
  const gameState = useGameStateStore();
  const gameSettings = useGameSettingsStore();
  const { boardSize } = storeToRefs(gameSettings);

  const bgaStatus = ref('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const bgaError = ref('');
  const bgaTableId = ref('');
  const bgaRawData = ref(null); // full response from scraper, used for DB save

  const loadFromSignature = (signature, startingPlayer = 1) => {
    const rows = boardSize.value.rows;
    const cols = boardSize.value.cols;
    const moves = signatureToMoves(signature, rows, cols);
    gameState.loadReplay(moves, startingPlayer);
  };

  const loadBgaGame = async () => {
    const id = String(bgaTableId.value).trim();
    if (!id) {
      bgaError.value = 'Entrez un identifiant de table BGA.';
      return;
    }
    bgaStatus.value = 'loading';
    bgaError.value = '';

    try {
      const response = await fetch(`${API_URL}/api/bga/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

      const signature = data.signature || '';
      if (!signature) throw new Error('Aucune séquence de coups trouvée dans cette partie.');

      // Parse optional board size from BGA (e.g. "7 columns, 6 rows")
      let rows = boardSize.value.rows;
      let cols = boardSize.value.cols;
      if (data.board_size) {
        const colMatch = data.board_size.match(/(\d+)\s*colou?mn/i);
        const rowMatch = data.board_size.match(/(\d+)\s*row/i);
        if (colMatch) cols = parseInt(colMatch[1]);
        if (rowMatch) rows = parseInt(rowMatch[1]);
        gameSettings.setBoardSize({ rows, cols });
      }

      const moves = signatureToMoves(signature, rows, cols);
      const startPlayer = data.starting_player === '2' ? 2 : 1;
      gameState.loadReplay(moves, startPlayer);

      bgaRawData.value = data; // store for DB save
      bgaStatus.value = 'success';
    } catch (err) {
      bgaError.value = err.message;
      bgaStatus.value = 'error';
    }
  };

  const resetBga = () => {
    bgaStatus.value = 'idle';
    bgaError.value = '';
    bgaTableId.value = '';
    bgaRawData.value = null;
  };

  return { bgaStatus, bgaError, bgaTableId, bgaRawData, loadBgaGame, loadFromSignature, resetBga };
}
