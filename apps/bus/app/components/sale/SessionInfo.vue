<script setup lang="ts">
import type { SaleSession, SaleStat } from '~/types/sale'

// Body of today's Session Info / End Session modals: counter, start time and staff on top,
// then counts on the left and money on a grey panel on the right.
const props = defineProps<{ session: SaleSession | null; counts: SaleStat[]; money: SaleStat[] }>()
const { me } = useMe()

const startedAt = computed(() => (props.session ? formatDateTime(props.session.opened_at) : null))

function show(stat: SaleStat): string {
    if (stat.value === null) return '—'
    return stat.money ? formatSen(stat.value) : stat.value.toLocaleString('en-MY')
}
</script>

<template>
    <div>
        <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.02]">
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400">Active Counter</div>
                <div class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ props.session?.counter_name ?? '—' }}</div>
            </div>
            <div class="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.02]">
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400">Started At</div>
                <div class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ startedAt ?? '—' }}</div>
            </div>
            <div class="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.02]">
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400">Staff Name</div>
                <div class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ me?.name ?? '—' }}</div>
            </div>
        </div>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div class="space-y-4">
                <div v-for="stat in props.counts" :key="stat.label">
                    <div class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ stat.label }}</div>
                    <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ show(stat) }}</div>
                </div>
            </div>
            <div class="space-y-4 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.02]">
                <div v-for="stat in props.money" :key="stat.label">
                    <div class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ stat.label }}</div>
                    <div class="text-lg font-semibold" :class="stat.highlight ? 'text-primary' : 'text-gray-900 dark:text-white'">{{ show(stat) }}</div>
                </div>
                <slot />
            </div>
        </div>
    </div>
</template>
