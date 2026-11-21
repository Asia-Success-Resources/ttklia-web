<script setup lang="ts">
import type { PageMeta } from '../../../base/app/types/api'

// Numbered pagination, laid out like ttklia-v2's resources/views/vendor/pagination/tailwind.blade.php:
// "Showing 1 to 10 of 250" on the left; previous, page numbers with "…" gaps and next on the right.
// On a phone the numbers give way to "Page 2 of 25".
const props = defineProps<{ meta: PageMeta; loading?: boolean }>()
const emit = defineEmits<{ page: [page: number] }>()

/** Page numbers to show: all when there are few, else the ends and two either side of the current page. */
const items = computed<(number | 'gap')[]>(() => {
    const { current_page: current, last_page: last } = props.meta
    if (last <= 9) return Array.from({ length: last }, (_, i) => i + 1)
    const pages = new Set([1, 2, last - 1, last])
    for (let p = current - 2; p <= current + 2; p++) if (p >= 1 && p <= last) pages.add(p)
    const sorted = [...pages].sort((a, b) => a - b)
    const out: (number | 'gap')[] = []
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1]! > 1) out.push('gap')
        out.push(p)
    })
    return out
})

function go(page: number) {
    if (props.loading || page < 1 || page > props.meta.last_page || page === props.meta.current_page) return
    emit('page', page)
}

const arrow = 'flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 shadow-xs sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
</script>

<template>
    <div class="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row dark:border-gray-800">
        <span class="block text-sm font-medium text-gray-500 dark:text-gray-400">
            Showing
            <span class="text-gray-800 dark:text-white/90">{{ props.meta.from ?? 0 }}</span>
            to
            <span class="text-gray-800 dark:text-white/90">{{ props.meta.to ?? 0 }}</span>
            of
            <span class="text-gray-800 dark:text-white/90">{{ props.meta.total.toLocaleString('en-MY') }}</span>
        </span>
        <div class="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-4 sm:w-auto sm:justify-normal sm:bg-transparent sm:p-0 dark:bg-white/[0.03] dark:sm:bg-transparent">
            <button
                type="button"
                aria-label="Previous page"
                :class="[arrow, props.meta.current_page <= 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 hover:text-gray-800 dark:hover:bg-white/[0.03] dark:hover:text-gray-200']"
                :disabled="props.meta.current_page <= 1"
                @click="go(props.meta.current_page - 1)"
            >
                <UIcon name="i-bx-arrow-left" class="size-5" />
            </button>

            <span class="block text-sm font-medium text-gray-700 sm:hidden dark:text-gray-400">
                Page {{ props.meta.current_page }} of {{ props.meta.last_page }}
            </span>

            <ul class="hidden items-center gap-0.5 sm:flex">
                <li v-for="(item, i) in items" :key="i">
                    <span v-if="item === 'gap'" class="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-gray-700 dark:text-gray-400">...</span>
                    <span
                        v-else-if="item === props.meta.current_page"
                        class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white"
                        aria-current="page"
                    >{{ item }}</span>
                    <button
                        v-else
                        type="button"
                        class="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-500 hover:text-white dark:text-gray-400 dark:hover:text-white"
                        @click="go(item)"
                    >{{ item }}</button>
                </li>
            </ul>

            <button
                type="button"
                aria-label="Next page"
                :class="[arrow, props.meta.current_page >= props.meta.last_page ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 hover:text-gray-800 dark:hover:bg-white/[0.03] dark:hover:text-gray-200']"
                :disabled="props.meta.current_page >= props.meta.last_page"
                @click="go(props.meta.current_page + 1)"
            >
                <UIcon name="i-bx-arrow-right" class="size-5" />
            </button>
        </div>
    </div>
</template>
