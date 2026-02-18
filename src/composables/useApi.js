import { useGame } from "./useGame.js";
import { useGameSettingsStore } from "../stores/gameSettings.js";
import { storeToRefs } from "pinia";
import { useGameStateStore } from "../stores/gameState.js";

const API_URL = 'http://localhost:3000/api';

export function useApi(){

   const gameSettingsStore = useGameSettingsStore();
   const gameStateStore = useGameStateStore();
   const { boardSize,startingPlayer,aiDepth,aiMode,gameMode } = storeToRefs(gameSettingsStore);
   const { moveHistory,currentPlayer,gameStatus,winner,winningCells } = storeToRefs(gameStateStore);
   const { getMoveSequenceFromMoveHistory } = useGame();

   const fetchGames = async () => {
      const response = await fetch(`${API_URL}/games`);
      const data = await response.json();
      return data.games || [];
   }

   const savedGameToDatabase = async () => {
      const moveSequence = getMoveSequenceFromMoveHistory();
      
      // Ensure status is a valid string
      const status = gameStatus.value || 'finished';
      
      // Properly stringify ligne_gagnante (winning cells)
      let ligneGagnante = null;
      if (winningCells.value && Array.isArray(winningCells.value) && winningCells.value.length > 0) {
         ligneGagnante = JSON.stringify(winningCells.value);
      }
      
      console.log('from useApi: ',moveSequence ,' ',gameMode.value, ' ',status,' ', winner.value,' ',ligneGagnante);
      
      const response = await fetch(`${API_URL}/games`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            signature: moveSequence,
            mode: "BGA",
            type_partie: gameMode.value || 'random',
            status: status,
            startingPlayer: startingPlayer.value,
            winner: winner.value,
            ligne_gagnante: ligneGagnante
         })
      });
      
      const data = await response.json();
      return { ok: response.ok, data };
   }
   // moveSequence,
   // mode,
   //    type_partie,
   //    status,
   //    startingPlayerInt,
   //    winning_player,
   //    winning_line,
   //    importedFrom
   // Fetch all situations for a given game (by id_partie)
   const fetchSituationsByGame = async (id_partie) => {
      const response = await fetch(`${API_URL}/games/${id_partie}/situations`);
      const data = await response.json();
      return data.situations || [];
   }

   return { fetchGames, savedGameToDatabase, fetchSituationsByGame };
}