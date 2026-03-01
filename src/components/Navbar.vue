<template>
   <header class="bg-slate-900 border-b border-slate-700/60 shadow-2xl sticky top-0 z-40">
      <div class="container mx-auto px-6 py-3 flex items-center justify-between">

         <!-- Brand -->
         <router-link to="/" class="flex items-center gap-2 select-none">
            <span class="text-2xl font-extrabold tracking-widest">
               <span class="text-red-500">C</span><span class="text-yellow-400">O</span><span class="text-red-500">N</span><span class="text-yellow-400">N</span><span class="text-red-500">E</span><span class="text-yellow-400">C</span><span class="text-red-500">T</span><span class="text-white"> 4</span>
            </span>
         </router-link>

         <!-- Nav links -->
         <nav class="flex items-center gap-2">
            <router-link
               to="/"
               class="text-slate-300 hover:text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition-all"
               active-class="bg-slate-700 text-white"
               exact
            >Accueil</router-link>
            <router-link
               to="/game"
               class="text-slate-300 hover:text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition-all"
               active-class="bg-slate-700 text-white"
            >Jouer</router-link>
         </nav>

      </div>
   </header>
</template>

<script setup>
</script>