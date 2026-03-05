<template>
  <!-- Overlay -->
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">

  <!-- Modal -->
  <div class="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-8">

    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <h2 class="text-xl font-bold text-white">⚙️ Paramètres de la partie</h2>
      <button @click="closeModal" class="text-slate-400 hover:text-white transition-colors text-xl leading-none">×</button>
    </div>

    <div class="space-y-7">

      <!-- Mode jeu -->
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Mode de jeu</label>
        <div class="flex gap-2">
          <button
            v-for="(label, val) in { 0: 'IA vs IA', 1: '1 Joueur', 2: '2 Joueurs' }"
            :key="val"
            @click="formData.gameMode = Number(val)"
            class="flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all border"
            :class="formData.gameMode === Number(val)
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'"
          >{{ label }}</button>
        </div>
      </div>

      <!-- Taille plateau -->
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Taille du plateau (9×9)</label>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-500 mb-1 block">Lignes</label>
            <input v-model.number="formData.rows" type="number" min="9" max="9"
              class="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">Colonnes</label>
            <input v-model.number="formData.columns" type="number" min="9" max="9"
              class="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          </div>
        </div>
      </div>

      <!-- Joueur qui commence -->
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Joueur qui commence</label>
        <div class="flex gap-2">
          <button @click="formData.startingPlayer = 'red'"
            class="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold border transition-all"
            :class="formData.startingPlayer === 'red'
              ? 'bg-red-700/60 border-red-500 text-white'
              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'">
            <span class="w-3 h-3 rounded-full bg-red-500"></span> Rouge
          </button>
          <button @click="formData.startingPlayer = 'yellow'"
            class="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold border transition-all"
            :class="formData.startingPlayer === 'yellow'
              ? 'bg-yellow-700/60 border-yellow-400 text-white'
              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'">
            <span class="w-3 h-3 rounded-full bg-yellow-400"></span> Jaune
          </button>
        </div>
      </div>

      <!-- Je joue en tant que (PvE seulement) -->
      <div v-if="formData.gameMode === 1">
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Je joue en tant que</label>
        <div class="flex gap-2">
          <button @click="formData.humanPlayer = 1"
            class="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold border transition-all"
            :class="formData.humanPlayer === 1
              ? 'bg-red-700/60 border-red-500 text-white'
              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'">
            <span class="w-3 h-3 rounded-full bg-red-500"></span> Rouge (1er)
          </button>
          <button @click="formData.humanPlayer = 2"
            class="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold border transition-all"
            :class="formData.humanPlayer === 2
              ? 'bg-yellow-700/60 border-yellow-400 text-white'
              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'">
            <span class="w-3 h-3 rounded-full bg-yellow-400"></span> Jaune (2ème)
          </button>
        </div>
      </div>

      <!-- Paramètres IA -->
      <div v-if="formData.gameMode !== 2" class="space-y-5">
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Paramètres IA</label>

        <!-- Confiance IA -->
        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-slate-300">Confiance IA</span>
            <span class="font-bold text-emerald-400">{{ formData.confiance }}</span>
          </div>
          <input v-model.number="formData.confiance" type="range" min="0" max="3"
            class="w-full accent-emerald-500" />
          <div class="flex justify-between text-xs text-slate-500 mt-1">
            <span>0 = perd exprès</span><span>1 = aléatoire</span><span>2+ = intelligent</span>
          </div>
        </div>

        <!-- Mode IA -->
        <div>
          <label class="block text-xs text-slate-400 mb-2">Mode IA</label>
          <div class="flex gap-2">
            <button @click="formData.aiMode = 'random'"
              class="flex-1 py-2 rounded-lg text-sm font-bold border transition-all"
              :class="formData.aiMode === 'random'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'">Aléatoire</button>
            <button @click="formData.aiMode = 'minimax'"
              class="flex-1 py-2 rounded-lg text-sm font-bold border transition-all"
              :class="formData.aiMode === 'minimax'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'">Minimax</button>
          </div>
        </div>

        <!-- Profondeur -->
        <div v-if="formData.aiMode === 'minimax'">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-slate-300">Profondeur</span>
            <span class="font-bold text-emerald-400">{{ formData.aiDepth }}</span>
          </div>
          <input v-model.number="formData.aiDepth" type="range" min="1" max="10"
            class="w-full accent-emerald-500" />
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="flex gap-3 mt-8">
      <button @click="cancelGame"
        class="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 transition-all">
        Annuler
      </button>
      <button @click="startGame"
        class="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5">
        🎮 Démarrer
      </button>
    </div>

  </div>
  </div>
</template>

<script setup>
import { reactive, computed } from "vue"

/* props */
const props = defineProps({
  modelValue: Boolean
})

/* emit */
const emit = defineEmits(["update:modelValue", "submit"])

/* modal control */
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

/* form data */
const formData = reactive({
  gameMode: 1,
  startingPlayer: "red",
  humanPlayer: 1,     // 1 = human plays Red, 2 = human plays Yellow

  // grille fixée 9x9
  rows: 9,
  columns: 9,

  // NOUVEAU champ demandé
  confiance: 1,

  aiMode: "minimax",
  aiDepth: 5
})

/* functions */
function closeModal() {
  isOpen.value = false
}

function cancelGame() {
  closeModal()
}

function startGame() {
  if (formData.rows !== 9 || formData.columns !== 9) {
    alert("La grille doit être 9x9")
    return
  }

  emit("submit", { ...formData })
  closeModal()
}
</script>
