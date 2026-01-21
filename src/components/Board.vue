<template>
   <!-- Board Container -->
   <div class="bg-white ">

      <!-- Game Grid: 8 rows x 9 columns -->
      <div class="grid grid-cols-9 gap-2">

         <!-- UNE SEULE CELLULE - Exemple à répéter avec v-for -->
         <Cell v-for="a in totalCells" :key="a" :col="Math.floor((a - 1) % cols)" :row="Math.floor((a - 1) / cols)" :boardValue="board[Math.floor((a - 1)/cols)][Math.floor((a - 1) % cols)]" @cell-clicked="fillColumn" />
         <!-- Répéter avec v-for pour toutes les cellules -->

      </div>
   </div>
</template>

<script setup>
import { computed } from 'vue';
import Cell from './Cell.vue';
import { useGame } from '../composables/useGame';
const props = defineProps({
   board: {
      type: Array,
   },
   boardSize: {
      type: Object,
   }
})

console.log(props.board);
console.log(props.boardSize);
const rows = props.boardSize.rows;
const cols = props.boardSize.cols
const totalCells = computed(() => cols * rows)
const {fillCol} = useGame();

const fillColumn = (col) => {
   fillCol(col);
   console.log('col is filled', col);
   
}

</script>