<script setup lang="ts">
import type { AppNotification, NotificationFilter } from '../composables/useNotifications'

// All notifications, ported from today's ttklia-v2 admin (admin/notifications/index.blade.php): a card with the
// count, filter tabs (Bus Refund, Taxi Refund, Staff Request, Genting Request, from the API), then the list,
// newest first, with "Load more" in place of page numbers. Opening it marks everything read, as there.
const { page, markAllRead } = useNotifications()
const route = useRoute()
const router = useRouter()

const rows = ref<AppNotification[]>([])
const filters = ref<NotificationFilter[]>([])
const total = ref(0)
const nextCursor = ref<string | null>(null)
const pending = ref(false)
const error = ref('')
const activeFilter = computed(() => (typeof route.query.filter === 'string' ? route.query.filter : null))

async function load(cursor?: string) {
    pending.value = true
    error.value = ''
    try {
        const res = await page({ filter: activeFilter.value ?? undefined, cursor, limit: 20 })
        if (!res) return
        const data = res.data ?? []
        rows.value = cursor ? [...rows.value, ...data] : data
        filters.value = res.filters ?? []
        total.value = res.total ?? 0
        nextCursor.value = res.next_cursor ?? null
    } catch {
        error.value = 'Notifications could not be loaded.'
    } finally {
        pending.value = false
    }
}

onMounted(async () => {
    await load()
    await markAllRead()
})
watch(activeFilter, () => load())

function setFilter(key: string | null) {
    router.replace({ query: { ...route.query, filter: key ?? undefined } })
}

const tabBase = 'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors'
const tabOn = 'bg-primary text-white'
const tabOff = 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]'
</script>

<template>
    <div class="rounded-2xl border border-(--ops-border) bg-white dark:bg-white/[0.03]">
        <div class="flex items-center justify-between border-b border-(--ops-border) px-6 py-5">
            <div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">All Notifications</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    You have {{ total }} notification{{ total !== 1 ? 's' : '' }}
                </p>
            </div>
        </div>

        <div class="flex flex-wrap gap-2 border-b border-(--ops-border) px-6 py-4">
            <button type="button" :class="[tabBase, !activeFilter ? tabOn : tabOff]" @click="setFilter(null)">All</button>
            <button
                v-for="filter in filters"
                :key="filter.key"
                type="button"
                :class="[tabBase, activeFilter === filter.key ? tabOn : tabOff]"
                @click="setFilter(filter.key)"
            >
                {{ filter.label }}
            </button>
        </div>

        <div class="p-6">
            <p v-if="error" class="mb-4 text-sm text-error">{{ error }}</p>

            <component
                :is="item.url ? 'a' : 'div'"
                v-for="(item, i) in rows"
                :key="item.id"
                :href="item.url ?? undefined"
                :target="item.url ? '_blank' : undefined"
                :rel="item.url ? 'noopener noreferrer' : undefined"
                class="-mx-2 flex items-start gap-4 rounded-xl p-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                :class="{ 'border-b border-(--ops-border)': i < rows.length - 1 }"
            >
                <span
                    class="flex size-10 shrink-0 items-center justify-center rounded-full"
                    :class="!item.read_at ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800'"
                >
                    <UIcon name="i-bx-bell" class="size-5" :class="!item.read_at ? 'text-primary' : 'text-gray-400 dark:text-gray-500'" />
                </span>
                <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-2">
                        <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ item.title }}</p>
                        <span class="shrink-0 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">{{ timeAgo(item.created_at) }}</span>
                    </div>
                    <p v-if="item.message" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ item.message }}</p>
                </div>
            </component>

            <div v-if="!pending && rows.length === 0 && !error" class="flex flex-col items-center justify-center py-16">
                <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <UIcon name="i-bx-bell" class="size-7 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 class="text-lg font-medium text-gray-800 dark:text-white/90">No notifications</h4>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ activeFilter ? 'Nothing matches this filter.' : "You're all caught up!" }}
                </p>
            </div>
        </div>

        <div v-if="nextCursor || pending" class="flex justify-center border-t border-(--ops-border) px-6 py-4">
            <UButton :loading="pending" variant="outline" color="neutral" label="Load more" @click="load(nextCursor ?? undefined)" />
        </div>
    </div>
</template>
