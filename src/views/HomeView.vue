<template>
<Navbar/>
  <main class="container mx-auto px-4 py-12">

      <!-- Actions Section -->
      <section class="max-w-lg mx-auto mb-16">
         <div class="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">

            <!-- Start New Game Button -->
            <button @click="()=>{isModalOpen = !isModalOpen ; console.log('modal toggled')}"
               class="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-2xl py-5 px-8 rounded-xl mb-4 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-emerald-500/40">
               🎮 Nouvelle Partie
            </button>

            <!-- Load Game Button -->
            <button
               class="w-full bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 font-bold text-2xl py-5 px-8 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
               📂 Charger une partie
            </button>

            <NewGameSettingsModal v-if="isModalOpen" v-model="isModalOpen" @submit="startANewGame"/>
         </div>
      </section>
      </main>
</template>

<script setup>
   import {useRouter} from 'vue-router'
   const router = useRouter();
   import Navbar from '../components/Navbar.vue'
   import NewGameSettingsModal from '../components/NewGameSettingsModal.vue';
   import { ref } from 'vue';
   import {useGameSettingsStore} from '../stores/gameSettings'
   const settings = useGameSettingsStore();
   const isModalOpen = ref(false);

   const startANewGame = (data) =>{
      settings.setSettings({
         gameMode:data.gameMode,
         startingPlayer:data.startingPlayer,
         boardSize:{rows:data.rows, col:data.cols},
         aiMode:data.aiMode,
         aiDepth:data.aiDepth
      })
      console.log('settings are setted');
      
      router.push('/game');
      console.log('starting a new game');
      
   }
</script>