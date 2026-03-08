<template>
   <Navbar />
   <main class="min-h-screen bg-slate-900 px-4 py-8">

      <!-- Header -->
      <section class="max-w-5xl mx-auto mb-6">
         <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6">
            <div class="flex justify-between items-center mb-6">
               <h1 class="text-2xl font-bold text-white">🗄️ Base de Données</h1>
               <button @click="refresh"
                  :disabled="loading"
                  class="bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-bold py-2 px-5 rounded-xl transition-all">
                  {{ loading ? '…' : '🔄 Actualiser' }}
               </button>
            </div>

            <!-- Server-side Stats -->
            <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
               <div class="bg-slate-700/60 rounded-xl p-3 text-center">
                  <p class="text-2xl font-extrabold text-white">{{ stats.totalGames }}</p>
                  <p class="text-xs text-slate-400">Parties totales</p>
               </div>
               <div class="bg-red-900/40 rounded-xl p-3 text-center">
                  <p class="text-2xl font-extrabold text-red-400">{{ stats.redWins }}</p>
                  <p class="text-xs text-slate-400">Victoires Rouge</p>
                  <p class="text-xs text-red-400/70">{{ stats.totalGames ? Math.round(stats.redWins/stats.totalGames*100) : 0 }}%</p>
               </div>
               <div class="bg-yellow-900/30 rounded-xl p-3 text-center">
                  <p class="text-2xl font-extrabold text-yellow-400">{{ stats.yellowWins }}</p>
                  <p class="text-xs text-slate-400">Victoires Jaune</p>
                  <p class="text-xs text-yellow-400/70">{{ stats.totalGames ? Math.round(stats.yellowWins/stats.totalGames*100) : 0 }}%</p>
               </div>
               <div class="bg-slate-700/40 rounded-xl p-3 text-center">
                  <p class="text-2xl font-extrabold text-slate-300">{{ stats.avgMoves }}</p>
                  <p class="text-xs text-slate-400">Coups moyens</p>
               </div>
            </div>

            <!-- Column frequency bar -->
            <div v-if="stats?.colFrequency" class="mb-4">
               <p class="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Fréquence par colonne (%)</p>
               <div class="flex gap-1 items-end h-12">
                  <div v-for="(pct, i) in stats.colFrequency" :key="i" class="flex-1 flex flex-col items-center gap-0.5">
                     <span class="text-[9px] text-slate-500">{{ pct }}</span>
                     <div class="w-full bg-sky-500 rounded-sm"
                        :style="{ height: `${Math.max(4, pct * 1.8)}px` }"></div>
                     <span class="text-[9px] text-slate-600">{{ i }}</span>
                  </div>
               </div>
            </div>

            <!-- Quick stats from local games list -->
            <div class="flex flex-wrap gap-2">
               <span v-for="(label, filter) in { all:'Toutes', completed:'Terminées', random:'Random', BGA:'BGA' }" :key="filter"
                  @click="activeFilter = filter"
                  class="px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all border"
                  :class="activeFilter === filter
                     ? 'bg-sky-600 border-sky-500 text-white'
                     : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'">
                  {{ label }} ({{ filterCount(filter) }})
               </span>
            </div>
         </div>
      </section>

      <!-- Games List -->
      <section class="max-w-5xl mx-auto">
         <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6">
            <h2 class="text-lg font-bold text-white mb-4">📋 Parties enregistrées</h2>

            <div v-if="games.length > 0" class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
               <div v-for="game in games" :key="game.id_partie"
                  class="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-700/40 px-4 py-2.5 hover:border-slate-500 transition-all">
                  <!-- Winner dot -->
                  <div class="w-3 h-3 rounded-full shrink-0"
                     :class="game.joueur_gagnant==='R' ? 'bg-red-500' : game.joueur_gagnant==='Y' ? 'bg-yellow-400' : 'bg-slate-600'"></div>
                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                     <p class="text-white text-sm font-semibold">
                        #{{ game.id_partie }}
                        <span class="text-slate-400 font-normal text-xs ml-1">{{ game.type_partie || game.mode }}</span>
                        <span v-if="game.bga_table_id" class="text-sky-400 font-mono text-xs ml-1">[BGA {{ game.bga_table_id }}]</span>
                     </p>
                     <p class="text-slate-500 font-mono text-xs truncate">{{ game.signature }}</p>
                  </div>
                  <div class="text-right shrink-0 text-xs text-slate-500">
                     <p>{{ game.signature?.length ?? 0 }} coups</p>
                     <p class="font-mono">{{ game.board_size || '7x6' }}</p>
                  </div>
                  <!-- Actions -->
                  <div class="flex gap-1 shrink-0">
                     <button @click="handleView(game)"
                        class="px-2 py-1 rounded bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs transition-all">👁</button>
                     <button @click="handleDelete(game.id_partie)"
                        class="px-2 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-300 text-xs transition-all">🗑</button>
                  </div>
               </div>
            </div>

            <!-- Empty state -->
            <div v-if="games.length === 0" class="text-center py-12">
               <p class="text-4xl mb-3">🎮</p>
               <p class="text-slate-500">Aucune partie dans la base de données</p>
            </div>
         </div>
      </section>

   </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '../components/Navbar.vue';
import { useApi } from '../composables/useApi';

const router = useRouter();
const { fetchGames, fetchStats, deleteGame } = useApi();

// Auth guard
onMounted(async () => {
   const token = localStorage.getItem('token');
   if (!token) { router.push({ name: 'home' }); return; }
   try {
      const response = await fetch('https://connect4-backend-xodq.onrender.com/api/games', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 403 || response.status === 401) { router.push({ name: 'home' }); return; }
   } catch { router.push({ name: 'home' }); return; }
   await refresh();
});

const loading = ref(false);
const allGames = ref([]);
const stats = ref(null);
const activeFilter = ref('all');

const refresh = async () => {
   loading.value = true;
   try {
      [allGames.value, stats.value] = await Promise.all([fetchGames(), fetchStats().catch(() => null)]);
   } finally {
      loading.value = false;
   }
};

const filterCount = (f) => {
   if (f === 'all') return allGames.value.length;
   if (f === 'completed') return allGames.value.filter(g => g.status === 'finished').length;
   if (f === 'random') return allGames.value.filter(g => g.type_partie === 'random').length;
   if (f === 'BGA') return allGames.value.filter(g => g.mode === 'BGA' || g.type_partie === 'scraped').length;
   return allGames.value.length;
};

const games = computed(() => {
   switch (activeFilter.value) {
      case 'completed': return allGames.value.filter(g => g.status === 'finished');
      case 'random':    return allGames.value.filter(g => g.type_partie === 'random');
      case 'BGA':       return allGames.value.filter(g => g.mode === 'BGA' || g.type_partie === 'scraped');
      default:          return allGames.value;
   }
});

const selectedGame = ref(null);
const situations = ref([]);
const currentSituationIndex = ref(0);

const currentSituation = computed(() => situations.value[currentSituationIndex.value] || null);

const handleView = (game) => { selectedGame.value = game; };

const handleDelete = async (id) => {
   if (!confirm(`Supprimer la partie #${id} ?`)) return;
   const { ok, data } = await deleteGame(id);
   if (ok) {
      allGames.value = allGames.value.filter(g => g.id_partie !== id);
      if (selectedGame.value?.id_partie === id) selectedGame.value = null;
   } else {
      alert(data?.error || 'Erreur lors de la suppression.');
   }
};
</script>
