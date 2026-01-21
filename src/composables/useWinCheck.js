import { useGameStateStore } from "../stores/gameState";
import { useGameSettingsStore } from "../stores/gameSettings";
import {storeToRefs} from 'pinia'
export  function useWinCheck(){
   const gameStateStore = useGameStateStore()
   const gameSettingsStore = useGameSettingsStore()
   const {boardSize} = storeToRefs(gameSettingsStore);
   const {board} = storeToRefs(gameStateStore)
  
   const {setWinner, setGameStatus} = gameStateStore;
   const horizontalCheck = (row, col, player) => {
      //check on the left
      console.log("using hc function");
      let leftCount = 0;
      let i = col - 1;
      while (i >= 0 && board.value[row][i] === player) {
         console.log(leftCount);
         leftCount++;
         i--;
      }
      //check on the right
      let rightCount = 0;
      let j = col + 1;
      while (j < boardSize.value.cols - 1 && board.value[row][j] == player) {
         console.log(rightCount);
         rightCount++;
         j++;
      }

      const totalCount = leftCount + 1 + rightCount;
      return totalCount >= 4
   }
   const verticalCheck = (row, col, player) => {
      console.log(row, col, player);

      //upper check
      let i = row - 1;
      let upperCount = 0;
      while (i >= 0 && board.value[i][col] == player) {
         upperCount++;
         i--;
      }

      //bottomCount
      let j = row + 1;
      let bottomCount = 0;
      while (j <= boardSize.value.rows - 1 && board.value[j][col] == player) {
         bottomCount++;
         j++;
      }

      const totalCount = bottomCount + 1 + upperCount;
      return totalCount >= 4;
   }

   const diagonalCheck = (row, col, player) => {
      // up right to down left check
      // upper Right  
      let i = col + 1;
      let j = row - 1;
      let upperRightCount = 0;
      while (i < boardSize.value.cols - 1 && j >= 0 && board.value[j][i] == player) {
         upperRightCount++;
         i++;
         j--;
      }
      // down left 
      i = col - 1;
      j = row + 1;
      let downLeftCount = 0;
      while (i >= 0 && j < boardSize.value.rows - 1 && board.value[j][i] == player) {
         downLeftCount++;
         i--;
         j++;
      }
      const totalURLDCount = upperRightCount + 1 + downLeftCount;

      //down right count
      i = col + 1;
      j = row + 1;
      let downRightCount = 0;
      while (i < boardSize.value.cols - 2 && j < boardSize.value.rows - 1 && board.value[j][i] == player) {
         downRightCount++;
         i++;
         j++;
      }

      //upper left count
      i = col - 1;
      j = row - 1;
      let upperLeftCount = 0;
      while (i >= 0 && j >= 0 && board.value[j][i] == player) {
         upperLeftCount++;
         i--;
         j--;
      }

      const totalULDRCount = upperLeftCount + 1 + downRightCount;

      return totalURLDCount >= 4 || totalULDRCount >= 4;
   }
   const checkProbableWin = (row, col, player) => {
      if (horizontalCheck(row, col, player) || verticalCheck(row, col, player) || diagonalCheck(row, col, player)
      ) {
         setWinner(player)
        setGameStatus("finished")
        
         alert("win")
      }
      // if(horizontalCheck(row,col)){
      //   HighlightRow(row);
      // }else if(verticalCheck(row,col)){
      //   HighlightCol(col);
      // }else if(diagonalCheck(row,col)){
      //   highl
   }

   return {checkProbableWin}
}