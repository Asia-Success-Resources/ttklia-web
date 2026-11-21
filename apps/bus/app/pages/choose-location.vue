<script setup lang="ts">
// Choose the location to work in (doc 16, "Domains and locations"): bus.ttklia.com has no location in its path, so the
// one picked here is kept in a cookie for a year (useSavedLocation) and every page uses it until another is picked
// here or in the workspace switcher. Shown when none is saved and the user holds more than one bus terminal.
// `?redirect=` brings them back to the page they asked for. Laid out as ttklia-v2's "Select a workspace to get
// started" cards (admin dashboard): icon tile, name, "Bus CTS Instance", a badge and a chevron.
useHead({ title: 'Choose location' })
definePageMeta({ layout: false })
const { me } = useMe()
const { saved } = useSavedLocation()
const route = useRoute()
const api = useApi()
const { logout } = useAuth()
const locations = computed(() => (me.value?.workspaces ?? []).filter((w) => w.type === 'bus_terminal'))

function open(slug: string) {
    const back = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'
    const target = back.startsWith('/choose-location') ? '/' : back
    // A full load at the new location, so /me and every list are read for it (ops-auth saves ?location=).
    navigateTo(`${target}${target.includes('?') ? '&' : '?'}location=${encodeURIComponent(slug)}`, { external: true })
}

async function signOut() {
    try {
        await api.post('/auth/logout')
    } finally {
        await logout()
    }
}
</script>

<template>
    <UApp :toaster="{ position: 'top-right' }">
        <div class="min-h-screen bg-(--app-body)">
            <header class="flex items-center justify-between border-b border-(--app-border) bg-(--app-card) px-4 py-3 sm:px-6">
                <div class="flex items-center gap-3">
                    <img src="/img/logo.png" alt="TTKLIA" class="size-8 object-contain" />
                    <span class="text-sm font-semibold">Bus CTS</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="hidden text-sm text-gray-500 sm:inline">{{ me?.name || me?.email }}</span>
                    <UButton label="Sign out" icon="i-bx-arrow-out-right-square-half" color="neutral" variant="ghost" size="sm" @click="signOut" />
                </div>
            </header>

            <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                <div class="mb-6">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Dashboard</h2>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Select a location to get started. It is remembered on this device; change it any time from the workspace switcher.
                    </p>
                </div>

                <p v-if="locations.length === 0" class="rounded-2xl border border-dashed border-(--app-border) p-6 text-center text-sm text-gray-500">
                    No locations available. Ask an admin to give you access to a bus terminal.
                </p>

                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <button
                        v-for="w in locations"
                        :key="w.slug"
                        type="button"
                        class="group rounded-2xl border bg-(--app-card) p-5 text-left transition-all hover:border-blue-300 hover:shadow-md dark:hover:border-blue-800"
                        :class="saved === w.slug ? 'border-blue-300 dark:border-blue-800' : 'border-(--app-border)'"
                        @click="open(w.slug)"
                    >
                        <div class="mb-4 flex items-center gap-4">
                            <div class="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400">
                                <UIcon name="i-bx-bus" class="size-6" />
                            </div>
                            <div class="min-w-0">
                                <h3 class="truncate text-sm font-semibold text-gray-800 transition-colors group-hover:text-blue-500 dark:text-white/90">{{ w.name }}</h3>
                                <p class="text-xs text-gray-400 dark:text-gray-500">Bus CTS Instance</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span
                                v-if="saved === w.slug"
                                class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            >
                                <span class="size-1.5 rounded-full bg-blue-500" />
                                Current · {{ w.code }}
                            </span>
                            <span
                                v-else
                                class="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-600 dark:bg-green-500/10 dark:text-green-400"
                            >
                                <span class="size-1.5 rounded-full bg-green-500" />
                                Active · {{ w.code }}
                            </span>
                            <UIcon name="i-bx-chevron-right" class="size-5 text-gray-400 transition-colors group-hover:text-blue-500" />
                        </div>
                    </button>
                </div>
            </main>
        </div>
    </UApp>
</template>
