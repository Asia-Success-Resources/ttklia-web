<script setup lang="ts">
// The board's "Month list" panel, as fleet-management's WorkspacePanel: months under their year,
// each with its number of date groups, newest first; "+" adds the month after the latest.
const props = defineProps<{
    months: { month: string; groups: number }[]
    active: string
}>()
const emit = defineEmits<{ select: [month: string]; add: [] }>()

const MONTH_FMT = new Intl.DateTimeFormat('en-GB', { month: 'long' })
function monthLabel(month: string): string {
    const [year, m] = month.split('-').map(Number) as [number, number]
    return MONTH_FMT.format(new Date(year, m - 1, 1))
}

const years = computed(() => {
    const byYear = new Map<string, { month: string; groups: number }[]>()
    // Newest first: the latest year on top, and within a year the latest month on top.
    for (const entry of [...props.months].sort((a, b) => b.month.localeCompare(a.month))) {
        const year = entry.month.slice(0, 4)
        if (!byYear.has(year)) byYear.set(year, [])
        byYear.get(year)!.push(entry)
    }
    return [...byYear.entries()].map(([year, months]) => ({ year, months }))
})
</script>

<template>
    <aside class="hidden w-64 shrink-0 flex-col border-r border-(--gm-board-border-strong) bg-zinc-900 text-(--gm-board-text) md:flex">
        <div class="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            <div class="flex h-9 items-center justify-between px-1.5">
                <span class="text-[13px] font-medium text-white">Month list</span>
                <button
                    type="button"
                    class="flex size-6 items-center justify-center rounded text-(--gm-board-placeholder) transition hover:bg-(--gm-board-row-hover) hover:text-white"
                    title="Add next month"
                    aria-label="Add next month"
                    @click="emit('add')"
                >
                    <UIcon name="i-bx-plus" class="size-4" />
                </button>
            </div>

            <div v-for="group in years" :key="group.year">
                <div class="sticky top-0 z-10 flex items-center gap-2 bg-zinc-900 px-1.5 pb-1 pt-3">
                    <span class="text-[11px] font-semibold uppercase tracking-wider text-(--gm-board-placeholder)">{{ group.year }}</span>
                    <span class="h-px flex-1 bg-(--gm-board-border-strong)" />
                </div>
                <ul role="listbox" :aria-label="`Months in ${group.year}`">
                    <li v-for="entry in group.months" :key="entry.month" role="option" :aria-selected="entry.month === active">
                        <button
                            type="button"
                            class="flex h-9 w-full items-center gap-2 rounded px-1.5 transition"
                            :class="entry.month === active
                                ? 'bg-(--gm-board-row-hover) font-medium text-white'
                                : 'text-(--gm-board-text-soft) hover:bg-(--gm-board-row-hover) hover:text-white'"
                            @click="emit('select', entry.month)"
                        >
                            <UIcon name="i-bx-sidebar" class="size-4" />
                            <span class="min-w-0 flex-1 truncate text-left text-[14px]">{{ monthLabel(entry.month) }}</span>
                            <span class="text-[12px] text-(--gm-board-placeholder)">{{ entry.groups }}</span>
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </aside>
</template>
