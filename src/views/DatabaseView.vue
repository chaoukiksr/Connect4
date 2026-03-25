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

            <!-- Filter tabs -->
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

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
               <span class="text-xs text-slate-400">
                  Page {{ currentPage }} / {{ totalPages }} &nbsp;·&nbsp; {{ totalGames }} parties
               </span>
               <div class="flex gap-1">
                  <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1"
                     class="px-3 py-1 rounded-lg text-sm font-bold transition-all
                            disabled:opacity-30 bg-slate-700 hover:bg-slate-600 text-white">‹</button>
                  <button v-for="p in totalPages" :key="p"
                     v-if="totalPages <= 10 || Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages"
                     @click="goToPage(p)"
                     class="px-3 py-1 rounded-lg text-sm font-bold transition-all"
                     :class="p === currentPage
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'">{{ p }}</button>
                  <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages"
                     class="px-3 py-1 rounded-lg text-sm font-bold transition-all
                            disabled:opacity-30 bg-slate-700 hover:bg-slate-600 text-white">›</button>
               </div>
            </div>
         </div>
      </section>

   </main>

   <!-- Game Preview Modal -->
   <Teleport to="body">
      <div v-if="selectedGame"
           class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
           @click.self="closePreview">
         <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg">

            <!-- Modal header -->
            <div class="flex justify-between items-start p-5 pb-3 border-b border-slate-700">
               <div>
                  <h3 class="text-white font-bold text-lg">Partie #{{ selectedGame.id_partie }}</h3>
                  <p class="text-slate-400 text-xs mt-0.5">
                     {{ selectedGame.type_partie || selectedGame.mode || '—' }}
                     &nbsp;·&nbsp; {{ selectedGame.signature?.length ?? 0 }} coups
                     &nbsp;·&nbsp; Gagnant :
                     <span :class="selectedGame.joueur_gagnant === 'R'
                        ? 'text-red-400 font-bold'
                        : selectedGame.joueur_gagnant === 'Y'
                           ? 'text-yellow-400 font-bold'
                           : 'text-slate-400'">
                        {{ selectedGame.joueur_gagnant === 'R' ? 'Rouge' : selectedGame.joueur_gagnant === 'Y' ? 'Jaune' : 'Nul / inconnu' }}
                     </span>
                  </p>
               </div>
               <button @click="closePreview"
                  class="text-slate-500 hover:text-white text-xl leading-none transition-colors ml-4">✕</button>
            </div>

            <!-- Board -->
            <div class="flex justify-center px-5 pt-4">
               <Board :key="selectedGame.id_partie" :board="board" :boardSize="previewBoardSize" />
            </div>

            <!-- Move counter + progress bar -->
            <div class="px-5 pt-3">
               <div class="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Coup {{ historyIndex + 1 }} / {{ moveHistory.length }}</span>
                  <span>{{ currentMovePlayer }}</span>
               </div>
               <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-sky-500 rounded-full transition-all duration-200"
                       :style="{ width: moveHistory.length ? `${((historyIndex + 1) / moveHistory.length) * 100}%` : '0%' }">
                  </div>
               </div>
            </div>

            <!-- Replay controls -->
            <div class="flex items-center justify-center gap-2 px-5 pt-4">
               <button @click="goToStart()"
                  class="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-all"
                  title="Début">⏮</button>
               <button @click="stepBackward()"
                  class="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-all"
                  title="Reculer">◀</button>
               <button @click="startAutoReplay()"
                  class="w-12 h-9 flex items-center justify-center rounded-lg text-white font-bold text-base transition-all"
                  :class="isReplaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-600 hover:bg-sky-700'"
                  title="Lecture / Pause">{{ isReplaying ? '⏸' : '▶' }}</button>
               <button @click="stepForward()"
                  class="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-all"
                  title="Avancer">▶</button>
               <button @click="goToEnd()"
                  class="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-all"
                  title="Fin">⏭</button>
            </div>

            <!-- Speed slider -->
            <div class="flex items-center gap-3 px-5 pt-3 pb-5">
               <span class="text-xs text-slate-500 shrink-0">🐢</span>
               <input type="range" v-model.number="replaySpeed" min="200" max="2000" step="100"
                  class="flex-1 accent-sky-500" />
               <span class="text-xs text-slate-500 shrink-0">🐇</span>
               <span class="text-xs text-slate-400 w-14 text-right shrink-0">{{ replaySpeed }}ms</span>
            </div>

         </div>
      </div>
   </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import Navbar from '../components/Navbar.vue';
import Board from '../components/Board.vue';
import { useApi } from '../composables/useApi';
import { useBga } from '../composables/useBga';
import { useReplay } from '../composables/useReplay';
import { useGameStateStore } from '../stores/gameState';
import { useGameSettingsStore } from '../stores/gameSettings';

// ── API ──────────────────────────────────────────────────────────────────────
const { fetchGames, fetchStats, deleteGame } = useApi();

// ── Pagination & list state ───────────────────────────────────────────────────
const loading = ref(false);
const allGames = ref([]);
const totalGames = ref(0);
const currentPage = ref(1);
const pageSize = 100;
const stats = ref(null);
const activeFilter = ref('all');

const totalPages = computed(() => Math.ceil(totalGames.value / pageSize));

const refresh = async () => {
   loading.value = true;
   try {
      const [gamesData, statsData] = await Promise.all([
         fetchGames(currentPage.value, pageSize),
         fetchStats().catch(() => null)
      ]);
      allGames.value = gamesData.games;
      totalGames.value = gamesData.total;
      stats.value = statsData;
   } finally {
      loading.value = false;
   }
};

const goToPage = (p) => {
   if (p < 1 || p > totalPages.value) return;
   currentPage.value = p;
   refresh();
};

onMounted(refresh);

const filterCount = (f) => {
   if (f === 'all') return totalGames.value;
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

// ── Game preview ──────────────────────────────────────────────────────────────
const gameState = useGameStateStore();
const gameSettings = useGameSettingsStore();
const { board, historyIndex, moveHistory, currentPlayer } = storeToRefs(gameState);
const { loadFromSignature } = useBga();
const { isReplaying, replaySpeed, startAutoReplay, stopAutoReplay, stepForward, stepBackward, goToStart, goToEnd } = useReplay();

const selectedGame = ref(null);
const previewBoardSize = ref({ rows: 6, cols: 7 });

const currentMovePlayer = computed(() => {
   if (historyIndex.value < 0) return 'Début';
   const move = moveHistory.value[historyIndex.value];
   return move?.player === 1 ? 'Rouge joue' : 'Jaune joue';
});

const handleView = (game) => {
   selectedGame.value = game;
   // Parse "7x6" → { cols: 7, rows: 6 }
   const [cols, rows] = (game.board_size || '7x6').split('x').map(Number);
   previewBoardSize.value = { rows: rows || 6, cols: cols || 7 };
   gameSettings.setBoardSize(previewBoardSize.value);
   const startPlayer = game.joueur_depart === 'Y' ? 2 : 1;
   loadFromSignature(game.signature, startPlayer);
   goToEnd(); // show final board state immediately
};

const closePreview = () => {
   stopAutoReplay();
   selectedGame.value = null;
   gameState.resetGame();
};

onBeforeUnmount(() => stopAutoReplay());

// ── Delete ────────────────────────────────────────────────────────────────────
const handleDelete = async (id) => {
   if (!confirm(`Supprimer la partie #${id} ?`)) return;
   const { ok, data } = await deleteGame(id);
   if (ok) {
      allGames.value = allGames.value.filter(g => g.id_partie !== id);
      if (selectedGame.value?.id_partie === id) closePreview();
   } else {
      alert(data?.error || 'Erreur lors de la suppression.');
   }
};
</script>
