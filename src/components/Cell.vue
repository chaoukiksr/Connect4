<template>
  <div
    @click="emit('cell-clicked', col)"
    class="aspect-square rounded-xl bg-white flex items-center justify-center transition"
    :class="{ 'ring-4 ring-green-400 scale-105': isWinning }"
  >
    <div
      class="w-4/5 h-4/5 rounded-full border-2 shadow-inner"
      :class="{
        'bg-slate-200 border-slate-300': boardValue === 0,
        'bg-gradient-to-br from-red-400 to-red-600 border-red-500': boardValue === 1,
        'bg-gradient-to-br from-yellow-300 to-amber-500 border-amber-400': boardValue === 2
      }"
    ></div>
  </div>
</template>

<script setup>
const props = defineProps({
  boardValue: Number,
  col: Number,
  row: Number,
  isWinning: Boolean
});

const emit = defineEmits(['cell-clicked']);
</script>
