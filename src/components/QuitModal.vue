<template>
   <div v-if="isOpen">
      <div @click="emit('cancel')" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
         <div @click.stop class="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <h2 class="text-xl font-bold text-white text-center mb-2">Quitter la partie ?</h2>
            <p class="text-slate-400 text-center text-sm mb-8">Toute progression non sauvegardée sera perdue.</p>

            <div class="flex flex-col gap-3">
               <button
                  type="button"
                  @click="emit('save-quit')"
                  class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all hover:-translate-y-0.5">
                  💾 Sauvegarder et quitter
               </button>

               <button
                  type="button"
                  @click="emit('quit')"
                  class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all hover:-translate-y-0.5">
                  ✕ Quitter sans sauvegarder
               </button>

               <button
                  type="button"
                  @click="emit('cancel')"
                  class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-6 rounded-xl transition-all">
                  Annuler
               </button>
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