<template>
  <Navbar />

  <main class="min-h-screen bg-slate-900 px-4 py-12">

    <!-- Hero -->
    <div class="text-center mb-10">
      <h2 class="text-4xl font-extrabold mb-2">
        <span class="text-red-500">M</span><span class="text-yellow-400">u</span><span class="text-red-500">l</span><span class="text-yellow-400">t</span><span class="text-red-500">i</span><span class="text-yellow-400">p</span><span class="text-red-500">l</span><span class="text-yellow-400">a</span><span class="text-red-500">y</span><span class="text-white">er</span>
      </h2>
      <p class="text-slate-400">Play Connect 4 online with a friend in real time</p>
    </div>

    <div class="max-w-md mx-auto space-y-5">

      <!-- Error banner -->
      <div v-if="errorMessage"
           class="bg-red-950 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
        <span>{{ errorMessage }}</span>
        <button @click="store.setError(null)" class="ml-3 text-red-400 hover:text-white font-bold">×</button>
      </div>

      <!-- ── Card: Create a Game ────────────────────────────────────────── -->
      <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-5">
        <h3 class="text-white font-bold text-lg">Create a Game</h3>

        <!-- Board size selector -->
        <div>
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Board Size
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="size in boardSizes"
              :key="size.label"
              @click="selectedSize = size"
              class="py-2 px-3 rounded-lg text-sm font-bold border-2 transition-all"
              :class="selectedSize.label === size.label
                ? 'border-emerald-500 bg-emerald-900/40 text-emerald-300'
                : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'"
            >
              {{ size.label }}
            </button>
          </div>
        </div>

        <!-- Create button -->
        <button
          @click="handleCreate"
          :disabled="isConnecting || gameStatus === 'waiting'"
          class="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg py-4 px-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5"
        >
          {{ isConnecting ? '⏳ Creating…' : '🎮 Create Game' }}
        </button>

        <!-- Share link (shown after room is created) -->
        <div v-if="gameStatus === 'waiting' && shareableUrl" class="space-y-3">
          <div class="border-t border-slate-700"></div>

          <p class="text-slate-400 text-sm text-center">
            Share this link with your friend:
          </p>

          <div class="flex gap-2">
            <input
              :value="shareableUrl"
              readonly
              class="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono focus:outline-none"
            />
            <button
              @click="copyLink"
              class="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg text-sm font-bold transition-all"
            >
              {{ copied ? '✓' : '📋' }}
            </button>
          </div>

          <!-- Waiting animation -->
          <div class="flex items-center justify-center gap-2 py-3 text-slate-400 text-sm">
            <span class="inline-flex gap-1">
              <span class="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
              <span class="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
              <span class="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
            </span>
            Waiting for opponent to join…
          </div>
        </div>
      </div>

      <!-- ── Card: Join a Game ──────────────────────────────────────────── -->
      <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-5">
        <h3 class="text-white font-bold text-lg">Join a Game</h3>
        <p class="text-slate-400 text-sm">
          Paste the room link or ID you received from your friend.
        </p>

        <div class="flex gap-2">
          <input
            v-model="joinInput"
            placeholder="Room ID or full URL"
            @keydown.enter="handleJoin"
            class="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-colors"
          />
          <button
            @click="handleJoin"
            :disabled="!joinInput.trim() || isConnecting"
            class="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-all"
          >
            Join
          </button>
        </div>
      </div>

      <!-- Back button -->
      <button
        @click="router.push('/')"
        class="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors"
      >
        ← Back to Home
      </button>

    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import Navbar from '../components/Navbar.vue';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useMultiplayer } from '../composables/useMultiplayer';

const router = useRouter();
const store = useMultiplayerStore();
const { createGame, joinGame, isConnecting } = useMultiplayer();

const { gameStatus, shareableUrl, errorMessage } = storeToRefs(store);

// ── Board size options ───────────────────────────────────────────────────────
const boardSizes = [
  { label: '6 × 7 (Standard)', rows: 6, cols: 7 },
  { label: '7 × 8', rows: 7, cols: 8 },
  { label: '8 × 9', rows: 8, cols: 9 },
  { label: '9 × 9', rows: 9, cols: 9 },
];
const selectedSize = ref(boardSizes[0]);

// ── Join input ───────────────────────────────────────────────────────────────
const joinInput = ref('');
const copied = ref(false);

// ── Handlers ─────────────────────────────────────────────────────────────────

const handleCreate = async () => {
  store.reset();
  await createGame({ rows: selectedSize.value.rows, cols: selectedSize.value.cols });
};

const handleJoin = async () => {
  const input = joinInput.value.trim();
  if (!input) return;

  // Accept full URL or bare roomId
  let roomId = input;
  if (input.includes('/game/')) {
    roomId = input.split('/game/')[1].split('?')[0].trim();
  }

  await joinGame(roomId);
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareableUrl.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // Fallback for browsers without clipboard API
    const el = document.createElement('textarea');
    el.value = shareableUrl.value;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
};

// ── Navigate to game once it starts ─────────────────────────────────────────
watch(gameStatus, (status) => {
  if (status === 'playing') {
    router.push(`/game/${store.roomId}`);
  }
});

onUnmounted(() => {
  // Don't reset if game is in progress — user may be navigating to game view
});
</script>
