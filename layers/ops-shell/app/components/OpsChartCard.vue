<script setup lang="ts">
// Chart card with ApexCharts (doc 09, "Dashboard"). Rendered on the client only.
const props = withDefaults(
    defineProps<{
        title: string
        type?: 'bar' | 'line' | 'area' | 'donut'
        series: { name: string; data: number[] }[]
        categories?: string[]
        /** Grow with the card (e.g. when a taller card beside it stretches the row); at least 260 px. */
        fill?: boolean
    }>(),
    { type: 'bar', categories: () => [], fill: false },
)

// With `fill`, the chart takes the height left in the card under the title, followed as the card resizes.
const body = ref<HTMLElement | null>(null)
const height = ref(260)
let observer: ResizeObserver | undefined
onMounted(() => {
    if (!props.fill || !body.value) return
    observer = new ResizeObserver(([entry]) => {
        height.value = Math.max(260, Math.floor(entry!.contentRect.height))
    })
    observer.observe(body.value)
})
onBeforeUnmount(() => observer?.disconnect())

// Series colours come from the --ops-chart-1/2 tokens (ops-theme.css), so an app can recolour charts.
// Read once on the client; the fallbacks are the token defaults.
const colors = ref(['#465fff', '#9cb9ff'])
onMounted(() => {
    const style = getComputedStyle(document.documentElement)
    colors.value = ['--ops-chart-1', '--ops-chart-2'].map(
        (name, i) => style.getPropertyValue(name).trim() || colors.value[i]!,
    )
})

// Axis text follows the theme (ApexCharts' default is near-black, unreadable on the dark card): gray-500 in light,
// gray-400 in dark. Grid lines (the value lines across the chart) at 60% opacity, so they sit behind the data.
const colorMode = useColorMode()
const dark = computed(() => colorMode.value === 'dark')

const options = computed(() => {
    const text = dark.value ? '#9ca3af' : '#6b7280'
    const line = dark.value ? 'rgba(75, 85, 99, 0.6)' : 'rgba(209, 213, 219, 0.6)'
    return {
        chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false }, foreColor: text, background: 'transparent' },
        theme: { mode: dark.value ? 'dark' : 'light' },
        colors: colors.value,
        dataLabels: { enabled: false },
        xaxis: {
            categories: props.categories,
            labels: { style: { colors: text } },
            axisBorder: { color: line },
            axisTicks: { color: line },
        },
        yaxis: { labels: { style: { colors: text } } },
        grid: { borderColor: line },
        legend: { labels: { colors: text } },
        tooltip: { theme: dark.value ? 'dark' : 'light' },
        noData: { text: 'No data yet', style: { color: text } },
    }
})
</script>

<template>
    <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) px-5 pt-5 sm:px-6 sm:pt-6" :class="{ 'flex h-full flex-col': props.fill }">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ props.title }}</h3>
        <!-- With fill the box grows with the card; the chart is drawn at the box's height, so it never pushes it taller. -->
        <div ref="body" :class="props.fill ? 'relative min-h-[260px] flex-1' : ''">
            <ClientOnly>
                <div :class="{ 'absolute inset-0': props.fill }">
                    <apexchart :type="props.type" :height="height" :options="options" :series="props.series" />
                </div>
            </ClientOnly>
        </div>
    </div>
</template>
