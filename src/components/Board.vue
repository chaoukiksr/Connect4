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

    <!-- Minimax Scores -->
    <div
      class="grid gap-2 mt-2"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
    >
      <div
        v-for="(score, index) in columnScores"
        :key="index"
        class="text-center font-bold p-2 text-sm"
        :class="{
          'text-green-600': score !== null && score > 0,
          'text-red-600': score !== null && score < 0,
          'text-gray-500': score === null || score === 0
        }"
      >
        {{ score !== null ? score : '-' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import Cell from './Cell.vue';
import { useGame } from '../composables/useGame';
import { useMinimax } from '../composables/useMinimax';
import { useGameStateStore } from '../stores/gameState';
import { useGameSettingsStore } from '../stores/gameSettings';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const props = defineProps({
  board: Array,
  boardSize: Object
});

const rows = props.boardSize.rows;
const cols = props.boardSize.cols;
const totalCells = computed(() => cols * rows);

const { fillCol } = useGame();
const { getColumnScores } = useMinimax();

const gameState = useGameStateStore();
const gameSettings = useGameSettingsStore();
const { winningCells } = storeToRefs(gameState);
const { aiDepth } = storeToRefs(gameSettings);

// Reactive column scores
const columnScores = ref(Array(cols).fill(null));

// Update scores whenever the board changes
watch(
  () => props.board,
  (newBoard) => {
    if (newBoard) {
      columnScores.value = getColumnScores(newBoard, aiDepth.value);
    }
  },
  { deep: true, immediate: true }
);

const fillColumn = (col) => {
  fillCol(col);
};
</script>
