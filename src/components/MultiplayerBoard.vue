<template>
  <div class="bg-slate-900 rounded-xl select-none">

    <!-- Column numbers + hover / suggestion indicator -->
    <div
      class="grid gap-1.5 mb-2"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
    >
      <div
        v-for="c in cols"
        :key="c"
        class="text-center text-xs font-bold transition-colors duration-200"
        :class="[
          suggestedCol === c - 1
            ? 'text-emerald-400 animate-pulse'
            : hoveredCol === c - 1 && canPlay
              ? 'text-white'
              : 'text-slate-500',
          canPlay ? 'cursor-pointer' : 'cursor-not-allowed',
        ]"
        @click="handleColClick(c - 1)"
        @mouseenter="hoveredCol = canPlay ? c - 1 : null"
        @mouseleave="hoveredCol = null"
      >
        {{ c }}
        <!-- AI suggestion arrow -->
        <span v-if="suggestedCol === c - 1" class="block text-[9px] leading-none">▼</span>
        <!-- Hover arrow -->
        <span v-else-if="hoveredCol === c - 1 && canPlay" class="block text-[9px] leading-none opacity-50">▼</span>
      </div>
    </div>

    <!-- Board frame -->
    <div class="bg-blue-900 rounded-xl p-3 shadow-inner shadow-blue-950">
      <div
        class="grid gap-1.5"
        :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
      >
        <div
          v-for="cellIndex in totalCells"
          :key="cellIndex"
          class="aspect-square rounded-full transition-all duration-200"
          :class="getCellClass(
            Math.floor((cellIndex - 1) / cols),
            (cellIndex - 1) % cols,
          )"
          @click="handleColClick((cellIndex - 1) % cols)"
          @mouseenter="hoveredCol = canPlay ? (cellIndex - 1) % cols : null"
          @mouseleave="hoveredCol = null"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  /** 2-D board array: 0 = empty, 1 = red, 2 = yellow */
  board: { type: Array, required: true },
  /** { rows, cols } */
  boardSize: { type: Object, required: true },
  /** Winning cell list [{row, col}, ...] */
  winningCells: { type: Array, default: () => [] },
  /** True when this client is allowed to click (their turn, game playing) */
  canPlay: { type: Boolean, default: false },
  /** AI-suggested column (0-indexed), or null */
  suggestedCol: { type: Number, default: null },
});

const emit = defineEmits(['col-clicked']);

const rows = computed(() => props.boardSize.rows);
const cols = computed(() => props.boardSize.cols);
const totalCells = computed(() => rows.value * cols.value);

const hoveredCol = ref(null);

const handleColClick = (col) => {
  if (!props.canPlay) return;
  emit('col-clicked', col);
};

/**
 * Determine CSS classes for each cell based on its value and highlighted state.
 */
const getCellClass = (row, col) => {
  const value = props.board?.[row]?.[col] ?? 0;
  const isWinning = props.winningCells.some((c) => c.row === row && c.col === col);
  const isHoveredCol = hoveredCol.value === col;
  const isSuggestedCol = props.suggestedCol === col;

  if (isWinning) {
    return value === 1
      ? 'bg-red-400 ring-4 ring-white/60 scale-110'
      : 'bg-yellow-300 ring-4 ring-white/60 scale-110';
  }

  if (value === 1) return 'bg-gradient-to-br from-red-400 to-red-600 shadow-md shadow-red-900/50';
  if (value === 2) return 'bg-gradient-to-br from-yellow-300 to-amber-500 shadow-md shadow-yellow-900/50';

  // Empty cell
  return [
    'bg-slate-900/80 border border-slate-700/30',
    isSuggestedCol ? 'ring-1 ring-emerald-400/50' : '',
    isHoveredCol && props.canPlay && !isSuggestedCol ? 'ring-1 ring-white/20' : '',
  ];
};
</script>
