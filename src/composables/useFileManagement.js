import { ref } from "vue";
import { useGameSettingsStore } from "../stores/gameSettings";
import { useGameStateStore } from "../stores/gameState";
import { storeToRefs} from 'pinia'
export function useFileManagement () {

   const gameSettingsStore = useGameSettingsStore();
   const gameStateStore = useGameStateStore();
   const {aiDepth,aiMode,boardSize,gameMode,startingPlayer} = storeToRefs(gameSettingsStore)
   const {board,currentPlayer,gameStatus,historyIndex,moveHistory
      ,winner
   } = storeToRefs(gameStateStore)
   
   
   const getGameData = (id = null) => ({
      'id': id ?? Date.now(), 
      "gameStatus": gameStatus.value,
      "currentPlayer": currentPlayer.value,
      "winner": winner.value,
      "board": board.value,
      "history": moveHistory.value,
      "historyIndex": historyIndex.value,
      "aiDepth": aiDepth.value,
      "aiMode": aiMode.value,
      "boardSize": boardSize.value,
      "gameMode": gameMode.value,
      "startingPlayer": startingPlayer.value
   });


   const download = () =>{
   const data = getGameData();
   const json = JSON.stringify(data, null, 2);
   const blob = new Blob([json], { type: 'application/json' })

   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = "connect4Game.json";
   a.click();

   URL.revokeObjectURL(url);
}
   const upload = (event, onSuccess) => {
      const file = event.target.files[0];
      if (!file) return;
      console.log('file uploaded')
      const reader = new FileReader();
      reader.onload = (e) => {
         try {
            const json = JSON.parse(e.target.result);
            const { 
               gameStatus:loadedGameStatus,
                currentPlayer: loadedCurrentPlayer,
                 winner: loadedWinner,
                  board: loadedBoard,
               history:loadedHistory,
               historyIndex: loadedHistoryIndex,
               aiDepth: loadedAiDepth,
               aiMode:loadedAiMode,
               boardSize:loadedBoardSize,
               gameMode:loadedGameMode,
               startingPlayer:loadedStartingPlayer

                } = json;

            gameStatus.value = loadedGameStatus;
            currentPlayer.value = loadedCurrentPlayer;
            winner.value = loadedWinner;
            board.value = loadedBoard;
            moveHistory.value = loadedHistory;
            historyIndex.value = loadedHistoryIndex;
            aiDepth.value = loadedAiDepth;
            aiMode.value = loadedAiMode;
            boardSize.value = loadedBoardSize;
            gameMode.value = loadedGameMode;
            startingPlayer.value = loadedStartingPlayer;
            
            console.log("Game loaded successfully")
            if (onSuccess) onSuccess()
         } catch (error) {
            console.log("invalide file: ", error);
         }
      }
      reader.readAsText(file);
   }
   const save = ()=>{
      const data = getGameData();
      const existingGames = JSON.parse(localStorage.getItem('games')) || [];
      existingGames.push(data);
      localStorage.setItem('games', JSON.stringify(existingGames));
      console.log('Game saved successfully');
   }
   return {download,upload,save}
}