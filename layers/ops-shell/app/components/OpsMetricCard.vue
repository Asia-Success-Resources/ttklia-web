<script setup lang="ts">
// rounded-2xl card: icon, label, big number; RM amounts with 2 decimals (doc 09, "Dashboard").
const props = withDefaults(defineProps<{ label: string; value: number | null; money?: boolean; icon?: string }>(), {
  money: false,
  icon: 'i-bx-bar-chart',
})
const display = computed(() => {
  if (props.value === null) return '—'
  return props.money ? formatSen(props.value) : props.value.toLocaleString('en-MY')
})
</script>

<template>
  <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5 md:p-6">
    <div class="flex size-12 items-center justify-center rounded-xl bg-(--ops-icon-bg)">
      <UIcon :name="props.icon" class="size-6 text-gray-800 dark:text-white/90" />
    </div>
    <div class="mt-5">
      <span class="text-sm text-gray-500 dark:text-gray-400">{{ props.label }}</span>
      <h4 class="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{{ display }}</h4>
    </div>
  </div>
</template>
