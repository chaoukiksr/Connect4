import { useGameStateStore } from "../stores/gameState"
import { useGameSettingsStore } from "../stores/gameSettings"
import { storeToRefs } from 'pinia'

export function useAi() {
   const gameStateStore = useGameStateStore()
   const gameSettingsStore = useGameSettingsStore()
   const { board } = storeToRefs(gameStateStore)
   const { boardSize } = storeToRefs(gameSettingsStore)

   const isColAvailable = (col) => {
      return board.value[0][col] === 0
   }

   const getAvailableCol = () => {
      const availableCols = []
      for (let i = 0; i < boardSize.value.cols; i++) {
         if (isColAvailable(i)) {
            availableCols.push(i)
         }
      }
      return availableCols
   }

   const calculateCol = () => {
      const availableCols = getAvailableCol()
      if (availableCols.length === 0) return -1
      const randomColIndex = Math.floor(Math.random() * availableCols.length)
      return availableCols[randomColIndex]
   }

   return { calculateCol, getAvailableCol }
}
