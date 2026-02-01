import { useGameStateStore } from "../stores/gameState";
import { useGameSettingsStore } from "../stores/gameSettings";
import { storeToRefs } from "pinia";

export function useWinCheck() {
  const gameStateStore = useGameStateStore();
  const gameSettingsStore = useGameSettingsStore();

  const { boardSize } = storeToRefs(gameSettingsStore);
  const { board } = storeToRefs(gameStateStore);

  const { setWinner, setGameStatus, setWinningCells } = gameStateStore;

  const getLine = (cells) => cells.slice(0, 4);

  const horizontalCheck = (row, col, player) => {
    let cells = [{ row, col }];

    let i = col - 1;
    while (i >= 0 && board.value[row][i] === player) {
      cells.unshift({ row, col: i });
      i--;
    }

    i = col + 1;
    while (i < boardSize.value.cols && board.value[row][i] === player) {
      cells.push({ row, col: i });
      i++;
    }

    return cells.length >= 4 ? getLine(cells) : null;
  };

  const verticalCheck = (row, col, player) => {
    let cells = [{ row, col }];

    let i = row - 1;
    while (i >= 0 && board.value[i][col] === player) {
      cells.unshift({ row: i, col });
      i--;
    }

    i = row + 1;
    while (i < boardSize.value.rows && board.value[i][col] === player) {
      cells.push({ row: i, col });
      i++;
    }

    return cells.length >= 4 ? getLine(cells) : null;
  };

  const diagonalCheck = (row, col, player) => {
    let cells1 = [{ row, col }];
    let i = row - 1, j = col + 1;
    while (i >= 0 && j < boardSize.value.cols && board.value[i][j] === player) {
      cells1.unshift({ row: i, col: j });
      i--; j++;
    }

    i = row + 1; j = col - 1;
    while (i < boardSize.value.rows && j >= 0 && board.value[i][j] === player) {
      cells1.push({ row: i, col: j });
      i++; j--;
    }

    if (cells1.length >= 4) return getLine(cells1);

    let cells2 = [{ row, col }];
    i = row - 1; j = col - 1;
    while (i >= 0 && j >= 0 && board.value[i][j] === player) {
      cells2.unshift({ row: i, col: j });
      i--; j--;
    }

    i = row + 1; j = col + 1;
    while (i < boardSize.value.rows && j < boardSize.value.cols && board.value[i][j] === player) {
      cells2.push({ row: i, col: j });
      i++; j++;
    }

    return cells2.length >= 4 ? getLine(cells2) : null;
  };

  const checkProbableWin = (row, col, player) => {
    const win =
      horizontalCheck(row, col, player) ||
      verticalCheck(row, col, player) ||
      diagonalCheck(row, col, player);

    if (win) {
      setWinningCells(win);
      setWinner(player);
      setGameStatus("finished");
    }
  };

  return { checkProbableWin };
}
