import {defineStore} from 'pinia';
import {ref} from 'vue'

export const useGameSettingsStore = defineStore('gameSettings',()=>{
      const gameMode = ref(1) //default
      const startingPlayer= ref('red')
      const boardSize = ref({rows:5, cols:6})
     
      const aiMode = ref('minimax') 
      const aiDepth = ref(5)

   const setGameMode = (mode) => gameMode.value = mode
   const setStartingPlayer = (player) => startingPlayer.value = player
   const setBoardSize = (size) => boardSize.value = size
   const setAiMode = (mode) => aiMode.value = mode
   const setAiDepth = (depth) => aiDepth.value = depth
  
   const setSettings = (settings) => {
      if (settings.gameMode !== undefined) gameMode.value = settings.gameMode
      if (settings.startingPlayer) startingPlayer.value = settings.startingPlayer
      if (settings.boardSize) boardSize.value = settings.boardSize
      if (settings.aiMode) aiMode.value = settings.aiMode
      if (settings.aiDepth !== undefined) aiDepth.value = settings.aiDepth
      console.log('settings are set in the store')
      console.log('settings recieved from the user: ',settings);
      
   }
   console.log(gameMode.value,' ',
      boardSize.value);
     
      return {
         gameMode,
         startingPlayer,
         aiDepth,
         aiMode,
         boardSize,
         setGameMode,
         setStartingPlayer,
         setBoardSize,
         setAiMode,
         setAiDepth,
         setSettings
      }
})