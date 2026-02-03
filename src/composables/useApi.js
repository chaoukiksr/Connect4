import { useGame } from "./useGame";
import { useGameSettingsStore } from "../stores/gameSettings";
import { storeToRefs } from "pinia";
import { useGameStateStore } from "../stores/gameState";

const API_URL = 'http://localhost:3000/api';

export function useApi(){
   // Must be INSIDE the function, not outside!
   const gameSettingsStore = useGameSettingsStore();
   const gameStateStore = useGameStateStore();
   const { boardSize } = storeToRefs(gameSettingsStore);
   const { moveHistory } = storeToRefs(gameStateStore);
   const { getMoveSequenceFromMoveHistory } = useGame();

   const fetchGames = async () => {
      const response = await fetch(`${API_URL}/games`);
      const data = await response.json();
      return data.games || [];
   }

   const savedGameToDatabase = async () => {
      const moveSequence = getMoveSequenceFromMoveHistory();

      const response = await fetch(`${API_URL}/games`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            moveSequence,
            boardRows: boardSize.value.rows,
            boardCols: boardSize.value.cols
         })
      });
      
      const data = await response.json();
      return { ok: response.ok, data };
   }

   return { fetchGames, savedGameToDatabase };
}