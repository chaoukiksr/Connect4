import { useGame } from "./useGame.js";
import { useGameSettingsStore } from "../stores/gameSettings.js";
import { storeToRefs } from "pinia";
import { useGameStateStore } from "../stores/gameState.js";

const API_URL = 'https://connect4-backend-xodq.onrender.com/api';

export function useApi(){

   const gameSettingsStore = useGameSettingsStore();
   const gameStateStore = useGameStateStore();
   const { boardSize,startingPlayer,aiDepth,aiMode,gameMode } = storeToRefs(gameSettingsStore);
   const { moveHistory,currentPlayer,gameStatus,winner,winningCells } = storeToRefs(gameStateStore);
   const { getMoveSequenceFromMoveHistory } = useGame();

   const fetchGames = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/games`, {
         headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      return data.games || [];
   }

   const savedGameToDatabase = async (extra = {}) => {
      const moveSequence = getMoveSequenceFromMoveHistory();
      
      // Ensure status is a valid string
      const status = gameStatus.value || 'finished';
      
      // Properly stringify ligne_gagnante (winning cells)
      let ligneGagnante = null;
      if (winningCells.value && Array.isArray(winningCells.value) && winningCells.value.length > 0) {
         ligneGagnante = JSON.stringify(winningCells.value);
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/games`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
         },
         body: JSON.stringify({
            signature: moveSequence,
            mode: extra.mode ?? 'normal',
            type_partie: extra.type_partie ?? (gameMode.value || 'random'),
            status: extra.status ?? status,
            startingPlayer: extra.startingPlayer ?? startingPlayer.value,
            winner: extra.winner ?? winner.value,
            ligne_gagnante: extra.ligne_gagnante ?? ligneGagnante,
            bga_table_id: extra.bga_table_id ?? null,
            board_size: extra.board_size ?? null,
         })
      });
      
      const data = await response.json();
      return { ok: response.ok, data };
   };

   const fetchStats = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/games/stats`, {
         headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error(`Stats fetch failed: ${response.status}`);
      return response.json();
   };

   const fetchProbability = async (board, currentPlayer = 1, depth = 4) => {
      const response = await fetch(`${API_URL}/probability`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ board, currentPlayer, depth })
      });
      if (!response.ok) throw new Error(`Probability fetch failed: ${response.status}`);
      return response.json();
   };

   const deleteGame = async (id) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/games/${id}`, {
         method: 'DELETE',
         headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      return { ok: response.ok, data };
   };

   // Fetch all situations for a given game (by id_partie)
   const fetchSituationsByGame = async (id_partie) => {
      const response = await fetch(`${API_URL}/games/${id_partie}/situations`);
      const data = await response.json();
      return data.situations || [];
   };

   return { fetchGames, savedGameToDatabase, fetchSituationsByGame, fetchStats, fetchProbability, deleteGame };
}