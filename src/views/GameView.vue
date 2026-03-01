<template>
   <Navbar />
   <main class="min-h-screen bg-slate-900 px-3 py-4 md:px-6 md:py-6">

      <!-- ── Player Turn Panels ─────────────────────────────────────── -->
      <div class="max-w-6xl mx-auto mb-4 grid grid-cols-2 gap-3">
         <!-- Rouge -->
         <div class="rounded-xl p-3 border-2 flex items-center gap-3 transition-all duration-300"
            :class="currentPlayer === 1 && gameStatus === 'playing'
               ? 'border-red-500 bg-red-950/40 shadow-lg shadow-red-500/20'
               : 'border-slate-700 bg-slate-800/60'">
            <div class="w-7 h-7 rounded-full bg-linear-to-br from-red-400 to-red-600 shrink-0"></div>
            <div>
               <p class="font-bold text-white text-sm">Joueur Rouge</p>
               <p class="text-xs" :class="currentPlayer === 1 && gameStatus === 'playing' ? 'text-red-400' : 'text-slate-500'">
                  {{ currentPlayer === 1 && gameStatus === 'playing' ? '▶ À jouer…' : 'En attente' }}
               </p>
            </div>
         </div>
         <!-- Jaune -->
         <div class="rounded-xl p-3 border-2 flex items-center gap-3 transition-all duration-300"
            :class="currentPlayer === 2 && gameStatus === 'playing'
               ? 'border-yellow-400 bg-yellow-950/40 shadow-lg shadow-yellow-400/20'
               : 'border-slate-700 bg-slate-800/60'">
            <div class="w-7 h-7 rounded-full bg-linear-to-br from-yellow-300 to-amber-500 shrink-0"></div>
            <div>
               <p class="font-bold text-white text-sm">Joueur Jaune</p>
               <p class="text-xs" :class="currentPlayer === 2 && gameStatus === 'playing' ? 'text-yellow-400' : 'text-slate-500'">
                  {{ currentPlayer === 2 && gameStatus === 'playing' ? '▶ À jouer…' : 'En attente' }}
               </p>
            </div>
         </div>
      </div>

      <!-- ── Winner Banner ──────────────────────────────────────────── -->
      <div v-if="winner" class="max-w-6xl mx-auto mb-4">
         <div class="rounded-xl p-3 text-center font-bold text-lg border-2"
            :class="winner === 1 ? 'border-red-500 bg-red-950/50 text-red-400' : 'border-yellow-400 bg-yellow-950/50 text-yellow-400'">
            🏆 {{ winner === 1 ? 'Rouge' : 'Jaune' }} a gagné !
         </div>
      </div>

      <!-- ── Main Layout ────────────────────────────────────────────── -->
      <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-5">

         <!-- ░░ BOARD ░░ -->
         <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-5">
            <Board :board="board" :boardSize="boardSize" />
         </div>

         <!-- ░░ SIDEBAR ░░ -->
         <div class="space-y-3 min-w-0">

            <!-- ── 1 · Status + main actions ──────────────────────── -->
            <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-1">

               <!-- Status badge -->
               <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-semibold uppercase tracking-widest text-slate-400">Statut</span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                     :class="{
                        'bg-slate-700 text-slate-400': gameStatus === 'start',
                        'bg-emerald-900 text-emerald-400': gameStatus === 'playing',
                        'bg-yellow-900 text-yellow-400': gameStatus === 'paused',
                        'bg-purple-900 text-purple-400': gameStatus === 'replay',
                        'bg-red-900 text-red-400': gameStatus === 'finished',
                     }">
                     {{ { start:'Prêt', playing:'● En jeu', paused:'⏸ Pause', replay:'⟳ Relecture', finished:'Terminée' }[gameStatus] ?? gameStatus }}
                  </span>
               </div>

               <!-- Toggle play/pause (not shown in replay mode) -->
               <button v-if="gameStatus !== 'replay'"
                  @click="toggleGameStatus"
                  class="w-full text-left px-3 py-2 rounded-lg font-bold text-sm transition-all hover:bg-slate-700"
                  :class="gameStatus === 'playing' ? 'text-yellow-400' : 'text-emerald-400'">
                  {{ gameStatus === 'start' ? '▶ Démarrer' : gameStatus === 'playing' ? '⏸ Pause' : '▶ Reprendre' }}
               </button>

               <div class="border-t border-slate-700/50"></div>

               <button @click="restartGame"
                  class="w-full text-left px-3 py-2 rounded-lg font-bold text-sm text-slate-200 hover:bg-slate-700 transition-all">
                  ↺ Recommencer
               </button>
               <div class="border-t border-slate-700/50"></div>
               <button @click="downloadGame"
                  class="w-full text-left px-3 py-2 rounded-lg font-bold text-sm text-yellow-500 hover:bg-slate-700 transition-all">
                  ⬇ Télécharger
               </button>
               <div class="border-t border-slate-700/50"></div>
               <button @click="saveGame"
                  class="w-full text-left px-3 py-2 rounded-lg font-bold text-sm text-yellow-500 hover:bg-slate-700 transition-all">
                  💾 Sauvegarder
               </button>
               <div class="border-t border-slate-700/50"></div>
               <button @click="quitGame"
                  class="w-full text-left px-3 py-2 rounded-lg font-bold text-sm text-red-400 hover:bg-slate-700 transition-all">
                  ✕ Quitter
               </button>
            </div>

            <!-- ── 2 · Replay controls ─────────────────────────────── -->
            <div v-if="gameStatus === 'replay' || moveHistory.length > 0"
               class="bg-slate-800 rounded-xl border border-slate-700 p-4">
               <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Relecture</p>

               <!-- Progress indicator -->
               <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>Coup {{ historyIndex + 1 }} / {{ moveHistory.length }}</span>
                  <span v-if="isReplaying" class="text-emerald-400 font-bold animate-pulse">● Auto</span>
               </div>
               <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div class="h-full bg-emerald-500 rounded-full transition-all duration-300"
                     :style="{ width: moveHistory.length ? `${((historyIndex + 1) / moveHistory.length) * 100}%` : '0%' }">
                  </div>
               </div>

               <!-- Controls: |< < ▶/⏸ > >| -->
               <div class="grid grid-cols-5 gap-1">
                  <button @click="goToStart" title="Début"
                     class="rounded-lg py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm transition-all">⏮</button>
                  <button @click="stepBackward" title="Reculer"
                     class="rounded-lg py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm transition-all">◀</button>
                  <button @click="startAutoReplay" title="Lecture / Pause auto"
                     class="rounded-lg py-2 font-bold text-sm transition-all"
                     :class="isReplaying ? 'bg-yellow-700 hover:bg-yellow-600 text-white' : 'bg-emerald-700 hover:bg-emerald-600 text-white'">
                     {{ isReplaying ? '⏸' : '▶' }}
                  </button>
                  <button @click="stepForward" title="Avancer"
                     class="rounded-lg py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm transition-all">▶</button>
                  <button @click="goToEnd" title="Fin"
                     class="rounded-lg py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm transition-all">⏭</button>
               </div>

               <!-- Speed -->
               <div class="mt-3">
                  <div class="flex justify-between text-xs text-slate-500 mb-1">
                     <span>Vitesse</span><span class="text-emerald-400 font-bold">{{ replaySpeed }}ms</span>
                  </div>
                  <input v-model.number="replaySpeed" type="range" min="200" max="2000" step="100"
                     class="w-full accent-emerald-500" />
               </div>
            </div>

            <!-- ── 3 · AI Progress ─────────────────────────────────── -->
            <div v-if="aiMode === 'minimax' && gameStatus === 'playing'"
               class="bg-slate-800 rounded-xl border border-slate-700 p-4">
               <label class="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  IA — réflexion <span class="text-emerald-400 font-bold">{{ aiThinkingProgress }}%</span>
               </label>
               <div class="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-150 ease-out"
                     :style="{ width: `${aiThinkingProgress}%` }"></div>
               </div>
            </div>

            <!-- ── 5 · Move Sequence ───────────────────────────────── -->
            <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
               <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Séquence de coups</p>
               <div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  <span v-for="(move, i) in moveHistory" :key="i"
                     class="text-xs font-mono px-1.5 py-0.5 rounded transition-all duration-150"
                     :class="[
                        i <= historyIndex
                           ? (move.player === 1 ? 'bg-red-900/80 text-red-300' : 'bg-yellow-900/80 text-yellow-300')
                           : 'bg-slate-700/40 text-slate-600',
                        i === historyIndex ? 'ring-1 ring-white/30 scale-110' : ''
                     ]">
                     C{{ move.col + 1 }}
                  </span>
                  <span v-if="moveHistory.length === 0" class="text-slate-600 text-xs">Aucun coup joué</span>
               </div>
            </div>

            <!-- ── 6 · Journal ─────────────────────────────────────── -->
            <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
               <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Journal</p>
               <div class="space-y-1 max-h-36 overflow-y-auto">
                  <div v-for="(entry, i) in gameLogs" :key="i"
                     class="flex gap-2 text-xs leading-relaxed">
                     <span class="text-slate-600 shrink-0 font-mono">{{ entry.time }}</span>
                     <span class="text-slate-300">{{ entry.message }}</span>
                  </div>
                  <div v-if="gameLogs.length === 0" class="text-slate-600 text-xs">Aucun événement.</div>
               </div>
            </div>

         </div><!-- /sidebar -->
      </div><!-- /main grid -->
   </main>

   <QuitModal :isOpen="showQuitModal" @cancel="showQuitModal = false" @quit="quitWithoutSaving" @save-quit="quitAndSave" />
</template>

<script setup>
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import Navbar from '../components/Navbar.vue';
import Board from '../components/Board.vue';
import QuitModal from '../components/QuitModal.vue';

import { useGameStateStore } from '../stores/gameState';
import { useGameSettingsStore } from '../stores/gameSettings';
import { useGame } from '../composables/useGame';
import { useFileManagement } from '../composables/useFileManagement';
import { useApi } from '../composables/useApi';
import { useReplay } from '../composables/useReplay';

const router = useRouter();

// ── Stores ──────────────────────────────────────────────────────────
const gameSettingsStore = useGameSettingsStore();
const gameStateStore = useGameStateStore();

const { aiDepth, aiMode, boardSize, gameMode, startingPlayer } = storeToRefs(gameSettingsStore);
const { board, currentPlayer, gameStatus, winner, moveHistory, historyIndex, aiThinkingProgress, gameLogs } = storeToRefs(gameStateStore);
const { resetGame, addLog } = gameStateStore;

// ── Composables ──────────────────────────────────────────────────────
const { startGame } = useGame();
const { download, save } = useFileManagement();
const { savedGameToDatabase } = useApi();
const { isReplaying, replaySpeed, startAutoReplay, stopAutoReplay, stepForward, stepBackward, goToStart, goToEnd } = useReplay();

// ── Local state ──────────────────────────────────────────────────────
const showQuitModal = ref(false);

// ── Watchers for journal ─────────────────────────────────────────────
watch(gameStatus, (val) => {
   if (val === 'playing') addLog('Partie démarrée.');
   if (val === 'paused')  addLog('Partie mise en pause.');
});

watch(winner, (val) => {
   if (val) addLog(`🏆 ${val === 1 ? 'Rouge' : 'Jaune'} a gagné la partie !`);
});

// ── Actions ──────────────────────────────────────────────────────────

const toggleGameStatus = () => {
   if (gameStatus.value === 'start') {
      gameStatus.value = 'playing';
      startGame();
   } else if (gameStatus.value === 'playing') {
      gameStatus.value = 'paused';
      stopAutoReplay();
   } else if (gameStatus.value === 'paused') {
      gameStatus.value = 'playing';
   }
};

const restartGame = () => {
   stopAutoReplay();
   resetGame();
};

const downloadGame = () => download();

const saveGame = async () => {
   save();
   const { ok, data } = await savedGameToDatabase();
   if (ok) { addLog('Partie sauvegardée en base.'); }
   else    { addLog(`Erreur sauvegarde : ${data.error}`); }
};

const quitGame = () => { showQuitModal.value = true; };
const quitWithoutSaving = () => { stopAutoReplay(); router.push('/'); };
const quitAndSave = () => { saveGame(); stopAutoReplay(); router.push('/'); };
</script>
