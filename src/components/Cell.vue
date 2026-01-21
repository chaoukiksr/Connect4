<template>
   <div @click="emit('cell-clicked',col)"
      class="aspect-square rounded-xl bg-white  flex items-center justify-center transition duration-150 hover:border-emerald-400/70 hover:shadow-emerald-400/20 hover:-translate-y-0.5"
   >
      <div
         class="w-4/5 h-4/5 rounded-full border-2 shadow-inner"
         :class="{
            'bg-slate-200 border-slate-300': boardValue === 0,
            'bg-gradient-to-br from-red-400 to-red-600 border-red-500 shadow-red-500/40': boardValue === 1,
            'bg-gradient-to-br from-yellow-300 to-amber-500 border-amber-400 shadow-amber-400/40': boardValue === 2
         }"
      ></div>
   </div>
</template>

<script setup>
const props = defineProps({
   boardValue: {
      type: Number,
      required: true
   },
   col:{
      type:Number
   },
   row:{
      type:Number
   }
})
const emit = defineEmits(['cell-clicked']);
</script>