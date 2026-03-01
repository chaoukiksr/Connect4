<template>
  <div class="bg-slate-900 rounded-xl">

    <!-- Numéros des colonnes -->
    <div
      class="grid gap-1.5 mb-2"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
    >
      <div
        v-for="col in cols"
        :key="col"
        class="text-center text-xs font-bold text-slate-500"
      >
        {{ col }}
      </div>
    </div>

    <!-- Board frame -->
    <div class="bg-blue-900 rounded-xl p-3 shadow-inner shadow-blue-950">
      <!-- Grille -->
      <div
        class="grid gap-1.5"
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

    <!-- Minimax Scores par colonne -->
    <div
      class="grid gap-1.5 mt-2"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
    >
      <div
        v-for="(score, index) in columnScores"
        :key="index"
        class="text-center font-bold text-xs py-1"
        :class="{
          'text-emerald-400': score !== null && score > 0,
          'text-red-400':     score !== null && score < 0,
          'text-slate-600':   score === null || score === 0
        }"
      >
        {{ score !== null ? score : '·' }}
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
/* Nombre de lignes */
const rows = props.boardSize.rows;
/* Nombre total de colonnes*/
const cols = props.boardSize.cols;
/* Nombre total de cellules */
const totalCells = computed(() => cols * rows);
/* Fonction pour remplir une colonne */
const { fillCol } = useGame();
/* Fonction Minimax pour calculer les scores */
const { getColumnScoresAsync } = useMinimax();

const gameState = useGameStateStore();
const gameSettings = useGameSettingsStore();
const { winningCells, gameStatus } = storeToRefs(gameState);
const { aiDepth } = storeToRefs(gameSettings);

// Reactive column scores
const columnScores = ref(Array(cols).fill(null));
/* Indique si un calcul est en cours */
let isCalculating = false;

/* Surveille les changements du plateau */
watch(
  () => props.board,
  async (newBoard) => {
  // Ignore si déjà en calcul ou si le jeu n’a pas commencé
    if (isCalculating || gameStatus.value === 'start') return;
    
    if (newBoard) {
      isCalculating = true;
      try {
        columnScores.value = await getColumnScoresAsync(newBoard, aiDepth.value);
      } finally {
        isCalculating = false;
      }
    }
  },
  { deep: true }
);

/* Surveille le changement d’état du jeu */
watch(
  () => gameStatus.value,
  async (status) => {
    if (status === 'playing' && props.board && !isCalculating) {
      isCalculating = true;
      try {
        columnScores.value = await getColumnScoresAsync(props.board, aiDepth.value);
      } finally {
        isCalculating = false;
      }
    }
  }
);

const fillColumn = (col) => {
  fillCol(col);
};
</script>
