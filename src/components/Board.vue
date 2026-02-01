<template>
  <div class="bg-white">

    <!-- Numéros des colonnes -->
    <div
      class="grid gap-2 mb-2"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
    >
      <div
        v-for="col in cols"
        :key="col"
        class="text-center font-bold text-gray-700"
      >
        {{ col }}
      </div>
    </div>

    <!-- Grille -->
    <div
      class="grid gap-2"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
    >
      <Cell
        v-for="a in totalCells"
        :key="a"
        :col="Math.floor((a - 1) % cols)"
        :row="Math.floor((a - 1) / cols)"
        :boardValue="board[Math.floor((a - 1)/cols)][Math.floor((a - 1) % cols)]"
        :isWinning="winningCells.some(
          c =>
            c.row === Math.floor((a - 1) / cols) &&
            c.col === Math.floor((a - 1) % cols)
        )"
        @cell-clicked="fillColumn"
      />
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import Cell from './Cell.vue';
import { useGame } from '../composables/useGame';
import { useGameStateStore } from '../stores/gameState';
import { storeToRefs } from 'pinia';

const props = defineProps({
  board: Array,
  boardSize: Object
});

const rows = props.boardSize.rows;
const cols = props.boardSize.cols;
const totalCells = computed(() => cols * rows);

const { fillCol } = useGame();

const gameState = useGameStateStore();
const { winningCells } = storeToRefs(gameState);

const fillColumn = (col) => {
  fillCol(col);
};
</script>
