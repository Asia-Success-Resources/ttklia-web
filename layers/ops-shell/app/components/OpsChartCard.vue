<script setup lang="ts">
// Chart card with ApexCharts (doc 09, "Dashboard"). Rendered on the client only.
const props = withDefaults(
  defineProps<{
    title: string
    type?: 'bar' | 'line' | 'area' | 'donut'
    series: { name: string; data: number[] }[]
    categories?: string[]
  }>(),
  { type: 'bar', categories: () => [] },
)

// Series colours come from the --ops-chart-1/2 tokens (ops-theme.css), so an app can recolour charts.
// Read once on the client; the fallbacks are the token defaults.
const colors = ref(['#465fff', '#9cb9ff'])
onMounted(() => {
  const style = getComputedStyle(document.documentElement)
  colors.value = ['--ops-chart-1', '--ops-chart-2'].map(
    (name, i) => style.getPropertyValue(name).trim() || colors.value[i]!,
  )
})

const options = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  colors: colors.value,
  dataLabels: { enabled: false },
  xaxis: { categories: props.categories },
  noData: { text: 'No data yet' },
}))
</script>

<template>
  <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) px-5 pt-5 sm:px-6 sm:pt-6">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ props.title }}</h3>
    <ClientOnly>
      <apexchart :type="props.type" height="260" :options="options" :series="props.series" />
    </ClientOnly>
  </div>
</template>
