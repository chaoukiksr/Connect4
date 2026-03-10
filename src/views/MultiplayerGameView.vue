<template>
  <Navbar />

  <!-- Status strip -->
  <div
    v-if="gameStatus === 'playing'"
    class="sticky top-0 z-30 text-center text-xs font-semibold py-1.5 px-4 border-b border-slate-700 transition-colors duration-300"
    :class="currentPlayer === 1 ? 'bg-red-950/80 text-red-300' : 'bg-yellow-950/80 text-yellow-300'"
  >
    <template v-if="isMyTurn">▶ Your turn</template>
    <template v-else>Waiting for opponent…</template>
  </div>

  <main class="bg-slate-900 px-2 py-3 md:px-6 md:py-5" :style="{ minHeight: 'calc(100vh - 48px)' }">

    <!-- ── LOBBY / WAITING STATE ──────────────────────────────────────── -->
    <div v-if="gameStatus === 'waiting' || gameStatus === 'lobby'" class="max-w-md mx-auto mt-16 text-center space-y-6">
      <div class="text-4xl">⏳</div>
      <h2 class="text-white text-2xl font-bold">Waiting for opponent…</h2>
      <p class="text-slate-400 text-sm">Share this link with your friend:</p>

      <div class="flex gap-2 max-w-sm mx-auto">
        <input
          :value="shareableUrl || currentUrl"
          readonly
          class="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono focus:outline-none"
        />
        <button @click="copyLink" class="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg text-sm font-bold transition-all">
          {{ copied ? '✓' : '📋' }}
        </button>
      </div>

      <div class="flex justify-center gap-1">
        <span class="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
        <span class="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
        <span class="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
      </div>

      <button @click="goBack" class="text-slate-500 hover:text-slate-300 text-sm transition-colors">
        ← Leave room
      </button>
    </div>

    <!-- ── GAME IN PROGRESS / FINISHED ───────────────────────────────── -->
    <template v-if="gameStatus === 'playing' || gameStatus === 'finished'">

      <!-- Player panels -->
      <div class="max-w-6xl mx-auto mb-3 grid grid-cols-2 gap-2">
        <div class="rounded-xl p-2.5 border-2 flex items-center gap-2.5 transition-all duration-300"
          :class="currentPlayer === 1 && gameStatus === 'playing'
            ? 'border-red-500 bg-red-950/40 shadow-lg shadow-red-500/20'
            : 'border-slate-700 bg-slate-800/60'">
          <div class="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 shrink-0 ring-2"
               :class="myPlayerNumber === 1 ? 'ring-white/40' : 'ring-transparent'" />
          <div class="min-w-0">
            <p class="font-bold text-white text-xs truncate">{{ myPlayerNumber === 1 ? '🧑 You' : '👤 Opponent' }} — Red</p>
            <p class="text-[10px]" :class="currentPlayer === 1 && gameStatus === 'playing' ? 'text-red-400' : 'text-slate-500'">
              {{ currentPlayer === 1 && gameStatus === 'playing' ? '▶ Playing…' : 'Waiting' }}
            </p>
          </div>
        </div>
        <div class="rounded-xl p-2.5 border-2 flex items-center gap-2.5 transition-all duration-300"
          :class="currentPlayer === 2 && gameStatus === 'playing'
            ? 'border-yellow-400 bg-yellow-950/40 shadow-lg shadow-yellow-400/20'
            : 'border-slate-700 bg-slate-800/60'">
          <div class="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shrink-0 ring-2"
               :class="myPlayerNumber === 2 ? 'ring-white/40' : 'ring-transparent'" />
          <div class="min-w-0">
            <p class="font-bold text-white text-xs truncate">{{ myPlayerNumber === 2 ? '🧑 You' : '👤 Opponent' }} — Yellow</p>
            <p class="text-[10px]" :class="currentPlayer === 2 && gameStatus === 'playing' ? 'text-yellow-400' : 'text-slate-500'">
              {{ currentPlayer === 2 && gameStatus === 'playing' ? '▶ Playing…' : 'Waiting' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Opponent disconnect notice -->
      <div v-if="opponentDisconnected && gameStatus === 'playing'" class="max-w-6xl mx-auto mb-3">
        <div class="bg-orange-950 border border-orange-700 text-orange-300 rounded-xl px-4 py-3 text-sm text-center">
          ⚠️ Opponent disconnected — <span class="font-bold">{{ disconnectCountdown }}s</span> to reconnect before forfeiting.
        </div>
      </div>

      <!-- Winner banner -->
      <div v-if="gameStatus === 'finished'" class="max-w-6xl mx-auto mb-4">
        <div class="rounded-xl p-4 text-center border-2 space-y-3" :class="winnerBannerClass">
          <p class="font-bold text-lg">{{ winnerBannerText }}</p>
          <div class="flex gap-3 justify-center">
            <button @click="playAgain"
              class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg transition-all">
              🔄 Play Again
            </button>
            <button @click="goBack"
              class="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold px-5 py-2 rounded-lg transition-all">
              ← Lobby
            </button>
          </div>
        </div>
      </div>

      <!-- Error banner -->
      <div v-if="errorMessage" class="max-w-6xl mx-auto mb-3">
        <div class="bg-red-950 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          <span>{{ errorMessage }}</span>
          <button @click="store.setError(null)" class="ml-3 text-red-400 hover:text-white font-bold">×</button>
        </div>
      </div>

      <!-- AI suggestion banner -->
      <div v-if="suggestedCol !== null && gameStatus === 'playing'" class="max-w-6xl mx-auto mb-3">
        <div class="bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-xl px-4 py-2 text-sm text-center flex items-center justify-center gap-3">
          <span>🤖 AI suggests: <strong>Column {{ suggestedCol + 1 }}</strong></span>
          <button @click="suggestedCol = null" class="text-emerald-500 hover:text-white font-bold text-lg leading-none">×</button>
        </div>
      </div>

      <!-- Main layout -->
      <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-5">

        <!-- Board -->
        <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-3 md:p-5">
          <MultiplayerBoard
            :board="board"
            :boardSize="boardSize"
            :winningCells="winningCells"
            :canPlay="isMyTurn"
            :suggestedCol="suggestedCol"
            @col-clicked="onColClicked"
          />
          <p class="mt-3 text-center text-xs font-semibold"
             :class="isMyTurn ? 'text-emerald-400 animate-pulse' : 'text-slate-500'">
            {{ isMyTurn ? '⬆ Click a column to play' : gameStatus === 'finished' ? '' : "Opponent's turn…" }}
          </p>
        </div>

        <!-- Sidebar -->
        <div class="space-y-3 min-w-0">

          <!-- Status + actions card -->
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-widest text-slate-400">Status</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                :class="{
                  'bg-yellow-900 text-yellow-400': gameStatus === 'waiting',
                  'bg-emerald-900 text-emerald-400': gameStatus === 'playing',
                  'bg-purple-900 text-purple-400': gameStatus === 'finished',
                }">
                {{ { waiting: '⏳ Waiting', playing: '● Live', finished: 'Finished' }[gameStatus] }}
              </span>
            </div>

            <div class="text-xs text-slate-400">
              You are
              <span class="font-bold" :class="myPlayerNumber === 1 ? 'text-red-400' : 'text-yellow-400'">
                {{ myPlayerNumber === 1 ? '🔴 Red' : '🟡 Yellow' }}
              </span>
            </div>

            <div class="border-t border-slate-700/50"></div>

            <!-- AI Suggestion button -->
            <button
              v-if="gameStatus === 'playing'"
              @click="computeSuggestion"
              :disabled="isSuggesting || !isMyTurn"
              class="w-full text-left px-3 py-2 rounded-lg font-bold text-sm transition-all hover:bg-slate-700 disabled:opacity-40 text-emerald-300"
            >
              {{ isSuggesting ? '⏳ Analysing…' : '🤖 AI Suggestion' }}
            </button>

            <div v-if="gameStatus === 'playing'" class="border-t border-slate-700/50"></div>

            <!-- Share link in sidebar -->
            <div v-if="shareableUrl" class="space-y-1.5">
              <p class="text-xs text-slate-500">Share link</p>
              <div class="flex gap-1">
                <input
                  :value="shareableUrl"
                  readonly
                  class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-emerald-400 font-mono focus:outline-none min-w-0"
                />
                <button @click="copyLink" class="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-xs font-bold transition-all text-slate-300">
                  {{ copied ? '✓' : '📋' }}
                </button>
              </div>
            </div>

            <div class="border-t border-slate-700/50"></div>

            <button @click="goBack"
              class="w-full text-left px-3 py-2 rounded-lg font-bold text-sm text-red-400 hover:bg-slate-700 transition-all">
              ✕ Leave game
            </button>
          </div>

          <!-- Move history -->
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Moves ({{ moveHistory.length }})
            </p>
            <div class="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
              <span
                v-for="(move, i) in moveHistory"
                :key="i"
                class="text-xs font-mono px-1.5 py-0.5 rounded"
                :class="move.player === 1 ? 'bg-red-900/80 text-red-300' : 'bg-yellow-900/80 text-yellow-300'"
              >
                C{{ move.col + 1 }}
              </span>
              <span v-if="moveHistory.length === 0" class="text-slate-600 text-xs">No moves yet</span>
            </div>
          </div>

          <!-- Room info -->
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Room</p>
            <p class="text-[10px] font-mono text-slate-500 break-all">{{ roomId }}</p>
            <p class="text-[10px] text-slate-600 mt-1">Board: {{ boardSize.rows }} × {{ boardSize.cols }}</p>
          </div>

        </div><!-- /sidebar -->
      </div><!-- /main grid -->
    </template>

    <!-- ── ERROR STATE ────────────────────────────────────────────────── -->
    <div v-if="gameStatus === 'error'" class="max-w-md mx-auto mt-16 text-center space-y-4">
      <div class="text-4xl">❌</div>
      <h2 class="text-white text-xl font-bold">Something went wrong</h2>
      <p class="text-red-400 text-sm">{{ errorMessage }}</p>
      <button @click="goBack" class="text-slate-400 hover:text-white text-sm transition-colors">
        ← Back to Multiplayer
      </button>
    </div>

  </main>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import Navbar from '../components/Navbar.vue';
import MultiplayerBoard from '../components/MultiplayerBoard.vue';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useMultiplayer } from '../composables/useMultiplayer';
import { useMinimax } from '../composables/useMinimax';

const route = useRoute();
const router = useRouter();
const store = useMultiplayerStore();
const { joinGame, sendMove, disconnect } = useMultiplayer();
const { analyseAsync } = useMinimax();

const {
  myPlayerNumber,
  roomId,
  shareableUrl,
  boardSize,
  board,
  currentPlayer,
  gameStatus,
  winner,
  winningCells,
  moveHistory,
  opponentDisconnected,
  disconnectCountdown,
  errorMessage,
  isMyTurn,
} = storeToRefs(store);

// ── AI suggestion ─────────────────────────────────────────────────────────────
const suggestedCol = ref(null);
const isSuggesting = ref(false);

const computeSuggestion = async () => {
  if (isSuggesting.value || !isMyTurn.value) return;
  isSuggesting.value = true;
  suggestedCol.value = null;
  try {
    // Run minimax locally at depth 4 — quick and strong enough for hints
    const { bestCol } = await analyseAsync(board.value, 4);
    suggestedCol.value = bestCol;
  } finally {
    isSuggesting.value = false;
  }
};

// Clear suggestion whenever the board changes (a move was made)
watch(moveHistory, () => { suggestedCol.value = null; }, { deep: true });

// ── Copy link ─────────────────────────────────────────────────────────────────
const copied = ref(false);
const currentUrl = computed(() => window.location.href);

const copyLink = async () => {
  const link = shareableUrl.value || currentUrl.value;
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    const el = document.createElement('textarea');
    el.value = link;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
};

// ── Winner banner ─────────────────────────────────────────────────────────────
const winnerBannerText = computed(() => {
  if (winner.value === null) return "🤝 It's a draw!";
  return winner.value === myPlayerNumber.value ? '🏆 You won!' : `${winner.value === 1 ? '🔴 Red' : '🟡 Yellow'} wins!`;
});

const winnerBannerClass = computed(() => {
  if (winner.value === null) return 'border-slate-500 bg-slate-800 text-slate-300';
  return winner.value === 1
    ? 'border-red-500 bg-red-950/50 text-red-400'
    : 'border-yellow-400 bg-yellow-950/50 text-yellow-400';
});

// ── Move handler ──────────────────────────────────────────────────────────────
const onColClicked = (col) => {
  if (!isMyTurn.value) return;
  suggestedCol.value = null;
  sendMove(col);
};

// ── Navigation ────────────────────────────────────────────────────────────────
const goBack = () => { disconnect(); router.push('/multiplayer'); };
const playAgain = () => { disconnect(); router.push('/multiplayer'); };

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  const urlRoomId = route.params.roomId;
  if (!urlRoomId) { router.push('/multiplayer'); return; }

  // Player 1 navigated here from the lobby after gameStarted fired — state is already correct.
  if (store.roomId === urlRoomId && myPlayerNumber.value !== null && gameStatus.value === 'playing') {
    return;
  }

  // Player 2 opening the link fresh, or either player reconnecting after a page refresh
  await joinGame(urlRoomId);
});

onUnmounted(() => {
  if (gameStatus.value === 'finished' || gameStatus.value === 'error') disconnect();
});
</script>
