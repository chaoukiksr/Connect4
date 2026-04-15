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
        class="text-center text-xs font-bold transition-colors duration-200"
        :class="suggestedCol === col - 1
          ? 'text-emerald-400 animate-pulse'
          : 'text-slate-500'"
      >
        {{ col }}
        <span v-if="suggestedCol === col - 1" class="block text-[9px] leading-none">▼</span>
      </div>
    </div>

    <!-- Board frame -->
    <div class="bg-blue-900 rounded-xl p-3 shadow-inner shadow-blue-950"
         :class="{ 'ring-2 ring-yellow-400/40': paintMode }">
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
          :isSuggestedCol="!paintMode && suggestedCol === Math.floor((a - 1) % cols)"
          :paintMode="paintMode"
          @cell-clicked="handleCellClick"
        />
      </div>
    </div>

    <!-- Scores minimax par colonne (valeurs numériques) -->
    <div
      class="grid gap-1.5 mt-2"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
    >
      <div
        v-for="(score, index) in columnScores"
        :key="index"
        class="text-center font-bold text-[9px] py-0.5 rounded leading-tight"
        :title="score !== null ? String(score) : ''"
        :class="colLabelClass(score)"
      >
        {{ formatScore(score) }}
      </div>
    </div>

    <!-- Probabilités de victoire par joueur -->
    <div v-if="winProbabilities && !paintMode"
      class="mt-2 rounded-lg bg-slate-800/60 px-3 py-2"
    >
      <div class="text-[9px] text-slate-400 text-center mb-1.5 uppercase tracking-wider font-semibold">
        Probabilité de victoire
      </div>

      <!-- Joueur 1 (Rouge) -->
      <div class="flex items-center gap-2 mb-1.5">
        <span class="text-[9px] font-bold text-red-400 w-12 text-right shrink-0">Rouge</span>
        <div class="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
          <div
            class="h-full bg-red-400 rounded-full transition-all duration-500"
            :style="{ width: winProbabilities.player1 + '%' }"
          />
        </div>
        <span class="text-[9px] font-bold text-red-400 w-7 shrink-0">{{ winProbabilities.player1 }}%</span>
      </div>

      <!-- Joueur 2 (Jaune) -->
      <div class="flex items-center gap-2">
        <span class="text-[9px] font-bold text-yellow-400 w-12 text-right shrink-0">Jaune</span>
        <div class="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
          <div
            class="h-full bg-yellow-400 rounded-full transition-all duration-500"
            :style="{ width: winProbabilities.player2 + '%' }"
          />
        </div>
        <span class="text-[9px] font-bold text-yellow-400 w-7 shrink-0">{{ winProbabilities.player2 }}%</span>
      </div>
    </div>

    <!-- Prediction globale de la position -->
    <div v-if="globalLabel && !paintMode"
      class="mt-2 text-center text-xs font-bold py-1.5 px-3 rounded-lg border border-current/30"
      :class="globalLabelClass"
    >
      Prediction IA : {{ globalLabel }}
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue';
import Cell from './Cell.vue';
import { useGame } from '../composables/useGame';
import { useMinimax } from '../composables/useMinimax';
import { useGameStateStore } from '../stores/gameState';
import { useGameSettingsStore } from '../stores/gameSettings';
import { storeToRefs } from 'pinia';

const props = defineProps({
  board:         Array,
  boardSize:     Object,
  suggestedCol:  { type: Number,  default: null },
  paintMode:     { type: Boolean, default: false },
  currentPlayer: { type: Number,  default: 2 },
});

const emit = defineEmits(['paint-cell']);

const rows = props.boardSize.rows;
const cols = props.boardSize.cols;
const totalCells = computed(() => cols * rows);

const { fillCol } = useGame();
const { getColumnScoresAsync, scoreToLabel } = useMinimax();

// Minimax score constants (mirror values from useMinimax)
const WIN       = 10_000_000;
const WIN_CLAMP = WIN / 2;

const gameState = useGameStateStore();
const gameSettings = useGameSettingsStore();
const { winningCells, gameStatus } = storeToRefs(gameState);
const { aiDepth } = storeToRefs(gameSettings);

// Column scores (raw minimax values, always from AI perspective)
const columnScores = ref(Array(cols).fill(null));
let isCalculating = false;

const recalculate = async (board) => {
  if (isCalculating || !board) return;
  isCalculating = true;
  try {
    columnScores.value = await getColumnScoresAsync(board, aiDepth.value, props.currentPlayer);
  } finally {
    isCalculating = false;
  }
};

watch(() => props.board, async (newBoard) => {
  if (gameStatus.value === 'start' || props.paintMode) return;
  await recalculate(newBoard);
}, { deep: true });

watch(() => gameStatus.value, async (status) => {
  if (status === 'playing') await recalculate(props.board);
});

// Format a raw minimax score as a compact number string
const formatScore = (score) => {
  if (score === null) return '·';
  if (score >= WIN_CLAMP)  return '+∞';
  if (score <= -WIN_CLAMP) return '-∞';
  if (Math.abs(score) >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`;
  if (Math.abs(score) >= 1_000)     return `${(score / 1_000).toFixed(1)}k`;
  return (score > 0 ? '+' : '') + String(score);
};

// Win probability for each player derived from the best available minimax score
const winProbabilities = computed(() => {
  if (gameStatus.value !== 'playing') return null;
  const valid = columnScores.value.filter(s => s !== null);
  if (!valid.length) return null;
  // Pick best reachable score from current player's perspective
  const best = props.currentPlayer === 2 ? Math.max(...valid) : Math.min(...valid);
  const clamped = Math.max(-WIN, Math.min(WIN, best));
  const p2 = Math.round((clamped + WIN) / (2 * WIN) * 100);
  return { player1: 100 - p2, player2: p2 };
});

// Label helpers
const LABEL_CLASSES = {
  Victoire:  'text-emerald-400 bg-emerald-900/40',
  Defaite:   'text-red-400 bg-red-900/40',
  Nul:       'text-sky-400 bg-sky-900/40',
  Incertain: 'text-amber-400 bg-amber-900/30',
};

const colLabelClass = (score) => {
  const label = scoreToLabel(score, props.currentPlayer);
  return label ? (LABEL_CLASSES[label] || '') : 'text-slate-700';
};

// Global prediction (best outcome for the current player)
const globalLabel = computed(() => {
  if (gameStatus.value !== 'playing') return null;
  const valid = columnScores.value.filter(s => s !== null);
  if (!valid.length) return null;
  // AI maximises; Human minimises (scores are from AI POV)
  const best = props.currentPlayer === 2 ? Math.max(...valid) : Math.min(...valid);
  return scoreToLabel(best, props.currentPlayer);
});

const globalLabelClass = computed(() => {
  return LABEL_CLASSES[globalLabel.value] || 'text-slate-400 bg-slate-800';
});

// Cell interaction
const handleCellClick = ({ row, col }) => {
  if (props.paintMode) emit('paint-cell', { row, col });
  else fillCol(col);
};
</script>
