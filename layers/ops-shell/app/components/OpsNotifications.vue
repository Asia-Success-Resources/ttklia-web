<script setup lang="ts">
// Header bell (doc 09, "Look and layout"), ported from today's ttklia-v2 admin
// (components/header/notification-dropdown.blade.php): a round 44 px button with an orange pinging dot while
// anything is unread; its panel lists the ten newest with "View All Notifications" under them. Opening the
// panel marks everything read, as there. The count refreshes every minute.
const { recent, unreadCount, refresh, markAllRead } = useNotifications()
const { resolveTo } = useOpsShell()
const open = ref(false)

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
    refresh()
    timer = setInterval(refresh, 60_000)
})
onBeforeUnmount(() => clearInterval(timer))

watch(open, async (isOpen) => {
    if (!isOpen) return
    await refresh()
    await markAllRead()
})

function truncate(text: string, length = 80): string {
    return text.length > length ? `${text.slice(0, length - 1)}…` : text
}
</script>

<template>
    <UPopover v-model:open="open" :content="{ align: 'end', sideOffset: 17 }">
        <button
            type="button"
            class="relative flex size-11 items-center justify-center rounded-full border border-(--ops-border) text-gray-500 transition-colors hover:bg-(--app-icon-bg) hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label="Notifications"
        >
            <span v-if="unreadCount > 0" class="absolute right-0 top-0.5 z-[1] size-2 rounded-full bg-orange-400">
                <span class="absolute inline-flex size-full -z-[1] animate-ping rounded-full bg-orange-400 opacity-75" />
            </span>
            <UIcon name="i-bx-bell" class="size-5" />
        </button>

        <template #content>
            <div class="flex max-h-[480px] w-[min(361px,100vw-2rem)] flex-col p-3">
                <div class="mb-3 flex items-center justify-between border-b border-(--ops-border) pb-3">
                    <h5 class="text-lg font-semibold text-gray-800 dark:text-white/90">Notification</h5>
                    <button type="button" class="text-gray-500 dark:text-gray-400" aria-label="Close" @click="open = false">
                        <UIcon name="i-bx-x" class="size-6" />
                    </button>
                </div>

                <ul class="scrollbar-hidden flex h-auto flex-col overflow-y-auto">
                    <li v-for="item in recent" :key="item.id">
                        <component
                            :is="item.url ? 'a' : 'div'"
                            :href="item.url ?? undefined"
                            :target="item.url ? '_blank' : undefined"
                            :rel="item.url ? 'noopener noreferrer' : undefined"
                            class="flex gap-3 rounded-lg border-b border-(--ops-border) px-4.5 py-3 hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                            <span class="block">
                                <span class="mb-1.5 block text-sm text-gray-500 dark:text-gray-400">
                                    <span class="font-medium text-gray-800 dark:text-white/90">{{ item.title }}</span>
                                    <template v-if="item.message"><br>{{ truncate(item.message) }}</template>
                                </span>
                                <span class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{{ timeAgo(item.created_at) }}</span>
                                    <span v-if="!item.read_at" class="size-1.5 rounded-full bg-primary" />
                                </span>
                            </span>
                        </component>
                    </li>
                    <li v-if="recent.length === 0" class="flex items-center justify-center py-10">
                        <span class="text-sm text-gray-400 dark:text-gray-500">No notifications yet</span>
                    </li>
                </ul>

                <NuxtLink
                    :to="resolveTo('/notifications')"
                    class="mt-3 flex justify-center rounded-lg border border-gray-300 p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    @click="open = false"
                >
                    View All Notifications
                </NuxtLink>
            </div>
        </template>
    </UPopover>
</template>
