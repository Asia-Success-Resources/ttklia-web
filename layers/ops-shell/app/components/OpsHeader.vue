<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

// Header (doc 09, "Look and layout"). Left: sidebar toggle, page search. Right, in this order: theme toggle
// (fleet-management style), workspace switcher, notifications, user menu.
const { collapsed, mobileOpen, resolveTo } = useOpsShell()
const { links } = useOpsMenu()
const { me } = useMe()
const api = useApi()
const { logout } = useAuth()

function toggleSidebar() {
    if (import.meta.client && window.innerWidth < 1024) mobileOpen.value = !mobileOpen.value
    else collapsed.value = !collapsed.value
}

/** Page search: the pages of this app's menu the user can open. */
interface PageItem {
    label: string
    suffix: string
    to: string
}
const pages = computed<PageItem[]>(() =>
    links.value.map((link) => ({ label: link.label, suffix: link.trail.slice(-1)[0] ?? '', to: resolveTo(link.to) })),
)
const picked = ref<PageItem | undefined>()
watch(picked, async (page) => {
    if (!page) return
    await navigateTo(page.to)
    picked.value = undefined
})

async function signOut() {
    try {
        await api.post('/auth/logout')
    } finally {
        await logout()
    }
}

/** User menu, as fleet-management's UserDropdown: round picture, then name and role (which links to the profile), sign out. */
const displayName = computed(() => me.value?.name || me.value?.email || 'Signed out')
const roleLabel = computed(() => me.value?.roles?.join(', ') || 'Member')
// The picture set in Account settings (users.avatar_key); initials when there is none.
const avatarUrl = computed<string | undefined>(() => me.value?.avatar_url ?? undefined)

// Account settings (OpsAccountSettings) is in every app: /profile, or /{location}/profile in taxi and vendor.
const profileTo = computed(() => resolveTo('/profile'))

const userItems = computed<DropdownMenuItem[][]>(() => [
    [
        { label: displayName.value, slot: 'account' as const, to: profileTo.value },
    ],
    [{ label: 'Account settings', icon: 'i-bx-cog', to: profileTo.value }],
    [{ label: 'Sign out', icon: 'i-bx-arrow-out-right-square-half', onSelect: signOut }],
])
</script>

<template>
    <header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-(--ops-border) bg-(--ops-header) px-4 md:px-6">
        <UButton icon="i-bx-menu" color="neutral" variant="outline" aria-label="Toggle sidebar" @click="toggleSidebar" />

        <UInputMenu
            v-model="picked"
            :items="pages"
            icon="i-bx-search"
            placeholder="Search pages…"
            class="hidden w-full max-w-xs md:block"
            aria-label="Search pages"
        />

        <div class="flex-1" />

        <ThemeToggle />
        <OpsWorkspaceSwitcher />
        <OpsNotifications />
        <UDropdownMenu :items="userItems" :content="{ align: 'end' }" :ui="{ content: 'w-56' }">
            <button type="button" class="rounded-full p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-primary)" aria-label="User menu">
                <UAvatar :src="avatarUrl" :alt="displayName" size="lg" />
            </button>

            <template #account>
                <div class="flex items-center gap-3 py-1 text-left">
                    <UAvatar :src="avatarUrl" :alt="displayName" size="lg" />
                    <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{{ displayName }}</p>
                        <p class="truncate text-xs capitalize text-gray-500 dark:text-gray-400">{{ roleLabel }}</p>
                    </div>
                </div>
            </template>
        </UDropdownMenu>
    </header>
</template>
