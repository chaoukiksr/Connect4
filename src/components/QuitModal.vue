<template>
   <div v-if="isOpen">
      <div @click="emit('cancel')" class="fixed inset-0 bg-black/50 flex items-center justify-center">
         <div @click.stop class="dialog bg-white p-4 rounded-2xl shadow-xl shadow-gray-400">
            <div class="content">
               <div class="title text-2xl font-bold text-center">Quit the game</div>
               <div class="message text-gray-500 text-center mb-4">Do you really want to quit the game ?</div>

               <div class="buttons flex flex-row gap-3">

                  <button 
                  type="button" 
                  @click="emit('save-quit')"
                  class= " bg-emerald-500 hover:bg-emerald-800 text-white p-3 rounded-lg">Quit and save</button>
                  
                  <button type="button"
                  @click="emit('quit')" 
                  class=" bg-red-500 hover:bg-red-800 text-white p-3 rounded-lg">Quit without saving</button>
                  
                  <button 
                  type="button"
                   @click="emit('cancel')" 
                  class=" bg-gray-200 hover:bg-gray-300 text-gray-700 p-3 rounded-lg">Cancel</button>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>
<script setup>
import { defineProps,defineEmits } from 'vue';
const props = defineProps({
   isOpen:{
      type:Boolean,
      default:false
   }
})
const emit = defineEmits(['save-quit', 'quit', 'cancel']);
</script>