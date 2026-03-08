<template>
   <Navbar />
   <main class="min-h-screen bg-slate-900 px-3 py-4 md:px-6 md:py-6">

      <!-- ── Header ─────────────────────────────────────────────────── -->
      <div class="max-w-6xl mx-auto mb-6 flex items-center gap-4">
         <button @click="router.push('/')"
            class="text-slate-400 hover:text-white transition-colors text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-slate-700">
            ← Retour
         </button>
         <div>
            <h1 class="text-2xl font-extrabold text-white">
               <span class="text-sky-400">BGA</span> Rejouer une partie
            </h1>
            <p class="text-slate-500 text-sm">Importez une partie Connect Four depuis BoardGameArena</p>
         </div>
      </div>

      <!-- ── Search bar ─────────────────────────────────────────────── -->
      <div class="max-w-6xl mx-auto mb-6">
         <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6">
            <p class="text-slate-400 text-sm mb-4">
               Entrez l'ID de la table BGA (ex : <span class="text-sky-400 font-mono">12345678</span>).
               Le backend va scraper la partie et la charger pour la relecture.
            </p>

            <div class="flex gap-3">
               <input v-model="bgaTableId"
                  placeholder="ID de table BGA…"
                  type="text"
                  class="flex-1 bg-slate-700 border border-slate-600 text-white text-base rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500 placeholder-slate-500"
                  @keyup.enter="handleLoad" />
               <button @click="handleLoad"
                  :disabled="bgaStatus === 'loading' || !bgaTableId"
                  class="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base transition-all shadow-lg shadow-sky-900/40">
                  {{ bgaStatus === 'loading' ? 'Chargement…' : '🔍 Charger' }}
               </button>
            </div>

            <!-- States -->
            <div v-if="bgaStatus === 'loading'" class="mt-4 flex items-center gap-3">
               <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
               <p class="text-yellow-400 text-sm font-medium">
                  Scraping BGA… le navigateur va s'ouvrir. Cela peut prendre 20–40 secondes.
               </p>
            </div>
            <div v-if="bgaStatus === 'error'" class="mt-4 flex items-center gap-3">
               <div class="w-2 h-2 bg-red-400 rounded-full"></div>
               <p class="text-red-400 text-sm">⚠ {{ bgaError }}</p>
            </div>
            <div v-if="bgaStatus === 'success'" class="mt-4 flex items-center gap-3">
               <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
               <p class="text-emerald-400 text-sm font-medium">✓ Partie chargée — utilisez les contrôles ci-dessous pour la relire.</p>
            </div>
         </div>
      </div>

      <!-- ── Database games selector ─────────────────────────────────── -->
      <div class="max-w-6xl mx-auto mb-6">
         <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6">
            <div class="flex items-center justify-between mb-4">
               <div>
                  <h2 class="text-white font-bold text-lg">Parties en base de données</h2>
                  <p class="text-slate-500 text-sm">Sélectionnez une partie sauvegardée pour la relire</p>
               </div>
               <button @click="loadDbGames"
                  :disabled="dbStatus === 'loading'"
                  class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold transition-all disabled:opacity-40">
                  {{ dbStatus === 'loading' ? '…' : '🔄 Actualiser' }}
               </button>
            </div>

            <div v-if="dbStatus === 'error'" class="text-red-400 text-sm">⚠ {{ dbError }}</div>

            <div v-if="dbStatus === 'idle'" class="text-slate-600 text-sm">
               Cliquez sur Actualiser pour charger les parties.
            </div>

            <div v-if="dbGames.length === 0 && dbStatus === 'success'" class="text-slate-500 text-sm">
               Aucune partie trouvée dans la base.
            </div>

            <!-- Game list -->
            <div v-if="dbGames.length > 0" class="space-y-2 max-h-80 overflow-y-auto pr-1">
               <button v-for="game in dbGames" :key="game.id_partie"
                  @click="loadDbGame(game)"
                  class="w-full text-left rounded-xl border px-4 py-3 transition-all duration-150"
                  :class="selectedDbGame?.id_partie === game.id_partie
                     ? 'border-sky-500 bg-sky-900/30'
                     : 'border-slate-700 bg-slate-700/40 hover:border-slate-500 hover:bg-slate-700'">

                  <div class="flex items-center justify-between gap-3">
                     <div class="flex items-center gap-3 min-w-0">
                        <!-- Winner dot -->
                        <div class="w-3 h-3 rounded-full shrink-0"
                           :class="game.joueur_gagnant === 'R' ? 'bg-red-500' : game.joueur_gagnant === 'Y' ? 'bg-yellow-400' : 'bg-slate-600'">
                        </div>
                        <div class="min-w-0">
                           <p class="text-white text-sm font-semibold">
                              #{{ game.id_partie }}
                              <span class="text-slate-400 font-normal">· {{ game.type_partie || game.mode }}</span>
                           </p>
                           <p class="text-slate-500 text-xs font-mono truncate">{{ game.signature }}</p>
                        </div>
                     </div>
                     <div class="text-right shrink-0">
                        <p class="text-xs font-bold"
                           :class="game.joueur_gagnant === 'R' ? 'text-red-400' : game.joueur_gagnant === 'Y' ? 'text-yellow-400' : 'text-slate-500'">
                           {{ game.joueur_gagnant === 'R' ? '🔴 Rouge' : game.joueur_gagnant === 'Y' ? '🟡 Jaune' : 'Nul' }}
                        </p>
                        <p class="text-slate-600 text-xs">{{ game.signature.length }} coups</p>
                     </div>
                  </div>
               </button>
            </div>

            <!-- Selected game confirmation -->
            <div v-if="selectedDbGame && gameStatus === 'replay'" class="mt-3 flex items-center gap-2">
               <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
               <p class="text-emerald-400 text-sm font-medium">✓ Partie #{{ selectedDbGame.id_partie }} chargée.</p>
            </div>
         </div>
      </div>

      <!-- ── Replay area (only when a game is loaded) ───────────────── -->
      <div v-if="gameStatus === 'replay'" class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-5">

         <!-- ░░ BOARD ░░ -->
         <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-5">

            <!-- Winner banner -->
            <div v-if="winner" class="mb-4 rounded-xl p-3 text-center font-bold text-lg border-2"
               :class="winner === 1 ? 'border-red-500 bg-red-950/50 text-red-400' : 'border-yellow-400 bg-yellow-950/50 text-yellow-400'">
               🏆 {{ winner === 1 ? 'Rouge' : 'Jaune' }} a gagné cette partie !
            </div>

            <Board :board="board" :boardSize="boardSize" />
         </div>

         <!-- ░░ SIDEBAR ░░ -->
         <div class="space-y-3">

            <!-- ── Save to DB ───────────────────────────────────────── -->
            <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
               <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sauvegarde</p>
               <button @click="saveCurrentGame"
                  :disabled="isSavingToDb || !!selectedDbGame"
                  class="w-full py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-40"
                  :class="saveMsg === 'ok' ? 'bg-emerald-700 text-white' : 'bg-sky-700 hover:bg-sky-600 text-white'">
                  {{ isSavingToDb ? '⏳ Sauvegarde…' : saveMsg === 'ok' ? '✓ Sauvegardé' : '💾 Sauvegarder en base' }}
               </button>
               <p v-if="saveMsgText" class="mt-2 text-xs"
                  :class="saveMsg === 'ok' ? 'text-emerald-400' : saveMsg === 'dup' ? 'text-yellow-400' : 'text-red-400'">
                  {{ saveMsgText }}
               </p>
               <p v-if="selectedDbGame" class="mt-2 text-xs text-slate-500">
                  Partie issue de la base — pas de doublon possible.
               </p>
            </div>

            <!-- ── Probability analysis ────────────────────────────── -->
            <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
               <div class="flex items-center justify-between mb-3">
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Probabilités</p>
                  <button @click="analysePosition" :disabled="prob.loading"
                     class="px-2 py-1 rounded text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-40 transition-all">
                     {{ prob.loading ? '⏳' : '🎯 Analyser' }}
                  </button>
               </div>
               <div v-if="prob.red !== null" class="space-y-2">
                  <!-- Red -->
                  <div>
                     <div class="flex justify-between text-xs mb-1">
                        <span class="text-red-400 font-bold">🔴 Rouge</span>
                        <span class="text-red-400 font-bold">{{ prob.red }}%</span>
                     </div>
                     <div class="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-red-500 rounded-full transition-all duration-300"
                           :style="{ width: `${prob.red}%` }"></div>
                     </div>
                  </div>
                  <!-- Yellow -->
                  <div>
                     <div class="flex justify-between text-xs mb-1">
                        <span class="text-yellow-400 font-bold">🟡 Jaune</span>
                        <span class="text-yellow-400 font-bold">{{ prob.yellow }}%</span>
                     </div>
                     <div class="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-yellow-400 rounded-full transition-all duration-300"
                           :style="{ width: `${prob.yellow}%` }"></div>
                     </div>
                  </div>
                  <p v-if="prob.bestCol !== null" class="text-xs text-emerald-400 font-medium pt-1">
                     Meilleur coup : Colonne {{ prob.bestCol + 1 }}
                  </p>
               </div>
               <div v-else-if="!prob.loading" class="text-xs text-slate-600">
                  Cliquez sur Analyser pour calculer les probabilités.
               </div>
               <p v-if="prob.error" class="mt-2 text-xs text-red-400">⚠ {{ prob.error }}</p>
            </div>

            <!-- ── Replay controls ──────────────────────────────────── -->
            <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
               <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Relecture</p>

               <!-- Progress -->
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
               <div class="grid grid-cols-5 gap-1 mb-3">
                  <button @click="goToStart" title="Début"
                     class="rounded-lg py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm transition-all">⏮</button>
                  <button @click="stepBackward" title="Reculer"
                     class="rounded-lg py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm transition-all">◀</button>
                  <button @click="isReplaying ? stopAutoReplay() : startAutoReplay()" title="Lecture / Pause"
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
               <div>
                  <div class="flex justify-between text-xs text-slate-500 mb-1">
                     <span>Vitesse</span><span class="text-emerald-400 font-bold">{{ replaySpeed }}ms</span>
                  </div>
                  <input v-model.number="replaySpeed" type="range" min="200" max="2000" step="100"
                     class="w-full accent-emerald-500" />
               </div>
            </div>

            <!-- ── Move Sequence ────────────────────────────────────── -->
            <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
               <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Séquence de coups</p>
               <div class="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
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
               </div>
            </div>

            <!-- ── Journal ─────────────────────────────────────────── -->
            <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
               <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Journal</p>
               <div class="space-y-1 max-h-40 overflow-y-auto">
                  <div v-for="(entry, i) in gameLogs" :key="i"
                     class="flex gap-2 text-xs leading-relaxed">
                     <span class="text-slate-600 shrink-0 font-mono">{{ entry.time }}</span>
                     <span class="text-slate-300">{{ entry.message }}</span>
                  </div>
                  <div v-if="gameLogs.length === 0" class="text-slate-600 text-xs">Aucun événement.</div>
               </div>
            </div>

         </div>
      </div>

   </main>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import Navbar from '../components/Navbar.vue';
import Board from '../components/Board.vue';

import { useGameStateStore } from '../stores/gameState';
import { useGameSettingsStore } from '../stores/gameSettings';
import { useReplay } from '../composables/useReplay';
import { useBga } from '../composables/useBga';
import { useApi } from '../composables/useApi';

const router = useRouter();

const gameStateStore = useGameStateStore();
const gameSettingsStore = useGameSettingsStore();

const { board, currentPlayer, gameStatus, winner, moveHistory, historyIndex, gameLogs } = storeToRefs(gameStateStore);
const { boardSize } = storeToRefs(gameSettingsStore);

const { isReplaying, replaySpeed, startAutoReplay, stopAutoReplay, stepForward, stepBackward, goToStart, goToEnd } = useReplay();
const { bgaStatus, bgaError, bgaTableId, bgaRawData, loadBgaGame, loadFromSignature, resetBga } = useBga();
const { fetchGames, savedGameToDatabase, fetchProbability } = useApi();

const handleLoad = () => {
   stopAutoReplay();
   loadBgaGame();
};

// ── DB games ─────────────────────────────────────────────────────────
const dbGames = ref([]);
const dbStatus = ref('idle'); // 'idle' | 'loading' | 'success' | 'error'
const dbError = ref('');
const selectedDbGame = ref(null);

const loadDbGames = async () => {
   dbStatus.value = 'loading';
   dbError.value = '';
   try {
      const games = await fetchGames();
      dbGames.value = games;
      dbStatus.value = 'success';
   } catch (err) {
      dbError.value = err.message || 'Erreur de chargement.';
      dbStatus.value = 'error';
   }
};

const loadDbGame = (game) => {
   stopAutoReplay();
   selectedDbGame.value = game;
   // joueur_depart: 'R' → 1, 'Y' → 2
   const startPlayer = game.joueur_depart === 'Y' ? 2 : 1;
   loadFromSignature(game.signature, startPlayer);
};

// ── Save to DB ──────────────────────────────────────────────────────────
const isSavingToDb = ref(false);
const saveMsg = ref('');       // '' | 'ok' | 'dup' | 'err'
const saveMsgText = ref('');

const saveCurrentGame = async () => {
   if (isSavingToDb.value) return;
   isSavingToDb.value = true;
   saveMsg.value = '';
   try {
      // Build extra metadata from raw BGA scrape or selected DB game
      const extra = {};
      if (bgaRawData.value) {
         extra.bga_table_id = String(bgaTableId.value);
         extra.board_size   = bgaRawData.value.board_size
            ? bgaRawData.value.board_size.replace(/\D+/g, 'x').replace(/x+/g, 'x').slice(0, 10)
            : `${boardSize.value.cols}x${boardSize.value.rows}`;
         extra.mode         = 'BGA';
         extra.type_partie  = 'scraped';
         extra.status       = bgaRawData.value.status || 'finished';
         extra.startingPlayer = bgaRawData.value.starting_player || 'red';
         extra.winner       = bgaRawData.value.winning_player === '2' ? 2
            : bgaRawData.value.winning_player === '1' ? 1 : null;
      } else if (selectedDbGame.value) {
         saveMsgText.value = 'Déjà en base de données.';
         saveMsg.value = 'dup';
         return;
      }
      const { ok, data } = await savedGameToDatabase(extra);
      if (ok) {
         saveMsg.value = 'ok';
         saveMsgText.value = `Partie enregistrée (#${data.game?.id_partie ?? '?'}).`;
      } else if (data?.error?.toLowerCase?.().includes('already')) {
         saveMsg.value = 'dup';
         saveMsgText.value = 'Déjà en base de données.';
      } else {
         saveMsg.value = 'err';
         saveMsgText.value = data?.error || 'Erreur lors de la sauvegarde.';
      }
   } catch (err) {
      saveMsg.value = 'err';
      saveMsgText.value = err.message;
   } finally {
      isSavingToDb.value = false;
   }
};

// ── Probability ──────────────────────────────────────────────────────────
const prob = ref({ red: null, yellow: null, bestCol: null, loading: false, error: '' });

const analysePosition = async () => {
   if (prob.value.loading || gameStatus.value !== 'replay') return;
   prob.value = { ...prob.value, loading: true, error: '' };
   try {
      const cp = currentPlayer.value;
      const result = await fetchProbability(board.value, cp, 4);
      prob.value = { red: result.red, yellow: result.yellow, bestCol: result.bestCol, loading: false, error: '' };
   } catch (err) {
      prob.value = { ...prob.value, loading: false, error: err.message };
   }
};

// Reset proba when step changes
watch(historyIndex, () => { prob.value = { red: null, yellow: null, bestCol: null, loading: false, error: '' }; });
</script>
