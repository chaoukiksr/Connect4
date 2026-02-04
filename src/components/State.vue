<template>
   <div 
      class="rounded-xl p-4 text-center border hover:shadow-md transition-all duration-300 cursor-pointer"
      :class="[colorMap[color].bg, active ? 'ring-2 ring-offset-2 ring-' + color + '-400' : '']"
      @click="emit('applyFilter', filterType)"
   >
      <p class="text-3xl font-bold" :class="colorMap[color].text">{{ value }}</p>
      <p class="font-medium" :class="colorMap[color].label">{{ label }}</p>
   </div>
</template>

<script setup>
const props = defineProps({
   label: {
      type: String,
      required: true
   },
   value: {
      type: Number,
      default: 0
   },
   color: {
      type: String,
      default: 'gray'
   },
   filterType: {
      type: String,
      default: null
   },
   active: {
      type: Boolean,
      default: false
   }
});
const emit = defineEmits(['applyFilter']);


const colorMap = {
   emerald: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200',
      text: 'text-emerald-600',
      label: 'text-emerald-700'
   },
   blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
      text: 'text-blue-600',
      label: 'text-blue-700'
   },
   orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
      text: 'text-orange-600',
      label: 'text-orange-700'
   },
   purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
      text: 'text-purple-600',
      label: 'text-purple-700'
   },
   gray: {
      bg: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200',
      text: 'text-gray-600',
      label: 'text-gray-700'
   }
};
</script>
