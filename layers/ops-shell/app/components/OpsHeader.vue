<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

// Header (doc 09, "Look and layout"). Left: sidebar toggle, page search. Right, in this order: theme toggle
// (fleet-management style), workspace switcher, notifications, user menu.
const { collapsed, mobileOpen, resolveTo } = useOpsShell()
const { groups } = useOpsMenu()
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
  groups.value.flatMap((group) =>
    group.items.map((item) => ({ label: item.label, suffix: group.title, to: resolveTo(item.to) })),
  ),
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
const displayName = computed(() => {
  const profile = me.value?.profile
  if (profile) return [profile.first_name, profile.surname].filter(Boolean).join(' ')
  return me.value?.name ?? 'Signed out'
})
const roleLabel = computed(() => me.value?.roles?.join(', ') || 'Member')
const avatarUrl = computed(() => me.value?.profile?.avatar_url || undefined)

// Only apps that have a profile page (today: admin) make the name block a link.
const router = useRouter()
const hasProfilePage = router.getRoutes().some((route) => route.path.split('/').pop() === 'profile')
const profileTo = computed(() => (hasProfilePage ? resolveTo('/profile') : null))

const userItems = computed<DropdownMenuItem[][]>(() => [
  [
    profileTo.value
      ? { label: displayName.value, slot: 'account' as const, to: profileTo.value }
      : { label: displayName.value, slot: 'account' as const, type: 'label' as const },
  ],
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
    <UChip :show="false" inset>
      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-full border border-(--ops-border) text-gray-500 transition-colors hover:bg-(--app-icon-bg) hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
        aria-label="Notifications"
      >
        <UIcon name="i-bx-bell" class="size-5" />
      </button>
    </UChip>
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
