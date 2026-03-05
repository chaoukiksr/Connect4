<template>
  <div
    @click="handleClick"
    class="aspect-square rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 group"
    :class="[
      isSuggestedCol && boardValue === 0
        ? 'bg-emerald-900/40 hover:bg-emerald-800/50 ring-1 ring-emerald-500/30'
        : 'bg-blue-950/80 hover:bg-blue-800/60',
      { 'ring-2 ring-yellow-300 shadow-lg shadow-yellow-300/40 scale-105': isWinning }
    ]"
  >
    <div
      class="w-5/6 h-5/6 rounded-full shadow-inner transition-all duration-200"
      :class="{
        'bg-blue-950 border border-blue-800 group-hover:bg-blue-900': boardValue === 0,
        'bg-linear-to-br from-red-400 to-red-700 border-2 border-red-300 shadow-md shadow-red-500/40': boardValue === 1,
        'bg-linear-to-br from-yellow-300 to-amber-500 border-2 border-yellow-200 shadow-md shadow-yellow-400/40': boardValue === 2
      }"
    ></div>
  </div>
</template>

<script setup>
const props = defineProps({
  boardValue: Number,
  col: Number,
  row: Number,
  isWinning: Boolean,
  isSuggestedCol: { type: Boolean, default: false },
  paintMode: { type: Boolean, default: false },
});

const emit = defineEmits(['cell-clicked']);

const handleClick = () => {
  // In paint mode we emit row+col; in normal mode we emit col only (for gravity)
  emit('cell-clicked', props.paintMode ? { col: props.col, row: props.row } : { col: props.col, row: props.row });
};
</script>
