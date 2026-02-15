<template>
  <!-- Overlay -->
  <div class="fixed inset-0 bg-black bg-opacity-60"></div>

  <!-- Modal -->
  <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">

    <!-- Header -->
    <div class="flex justify-between mb-6">
      <h2 class="text-2xl font-bold">⚙️ Paramètres de la partie</h2>
      <button @click="closeModal">✕</button>
    </div>

    <div class="space-y-6">

      <!-- Mode jeu -->
      <div>
        <label class="font-semibold">Mode de jeu</label>

        <div class="flex gap-2 mt-2">
          <button @click="formData.gameMode = 0">IA vs IA</button>
          <button @click="formData.gameMode = 1">1 joueur</button>
          <button @click="formData.gameMode = 2">2 joueurs</button>
        </div>
      </div>

      <!-- Taille plateau (MISSION 3.1 → 9x9 FIXE) -->
      <div>
        <label class="font-semibold">Taille du plateau (9×9)</label>

        <div class="grid grid-cols-2 gap-3 mt-2">
          <div>
            <label>Lignes</label>
            <input v-model.number="formData.rows" type="number" min="9" max="9" />
          </div>

          <div>
            <label>Colonnes</label>
            <input v-model.number="formData.columns" type="number" min="9" max="9" />
          </div>
        </div>
      </div>

      <!-- Joueur qui commence -->
      <div>
        <label class="font-semibold">Joueur qui commence</label>

        <div class="flex gap-2 mt-2">
          <button @click="formData.startingPlayer = 'red'">🔴 Rouge</button>
          <button @click="formData.startingPlayer = 'yellow'">🟡 Jaune</button>
        </div>
      </div>

      <!-- Paramètres IA -->
      <div v-if="formData.gameMode !== 2">

        <label class="font-semibold">Paramètres IA</label>

        <!-- Confiance IA (MISSION 3.1) -->
        <div class="mt-3">
          <label>
            Confiance IA : <strong>{{ formData.confiance }}</strong>
          </label>

          <input
            v-model.number="formData.confiance"
            type="range"
            min="0"
            max="3"
          />

          <div>
            <small>0 = perdre exprès</small> |
            <small>1 = aléatoire</small> |
            <small>2+ = intelligent</small>
          </div>
        </div>

        <!-- Mode IA -->
        <div class="mt-3">
          <label>Mode IA</label>

          <div class="flex gap-2 mt-1">
            <button @click="formData.aiMode = 'random'">Random</button>
            <button @click="formData.aiMode = 'minimax'">Minimax</button>
          </div>
        </div>

        <!-- Profondeur -->
        <div v-if="formData.aiMode === 'minimax'" class="mt-3">
          <label>Profondeur : {{ formData.aiDepth }}</label>
          <input v-model.number="formData.aiDepth" type="range" min="1" max="10" />
        </div>

      </div>

    </div>

    <!-- Footer -->
    <div class="flex gap-3 mt-6">
      <button @click="cancelGame">Annuler</button>
      <button @click="startGame">🎮 Démarrer</button>
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

/* form data (MISSION 3.1) */
const formData = reactive({
  gameMode: 1,
  startingPlayer: "red",

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
