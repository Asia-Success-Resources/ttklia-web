<script setup lang="ts">
import type { WorkspaceRef } from '../../../base/app/types/api'

// Workspace switcher (doc 09, "Workspace switcher"): a round 44 px grid button in the header, between the theme
// toggle and the notification bell. Its panel (320 px, full width on a phone) has the title "Switch Workspace",
// "Current: …" under it, then one tile per workspace the user holds a role in (from /me, doc 27): an icon in a
// coloured square, the name, and the type underneath. The current one has a brand border and a check badge.
// Footer: "Manage workspaces" (admin.ttklia.com/global/workspaces), with platform.workspaces.manage.
//
// Which tiles: only workspaces from /me. A user with one workspace and no Global role sees no button. In preview
// (no API configured) the button shows with an empty panel, as the menus show every item in preview.
//
// Switching (doc 09, doc 16):
// - same app (KL2 → Lalaport in bus): only the location in the path changes, on the same page;
// - another app (bus → taxi): that app's address (useAppAddress), with no new login (shared session).
// Global tile ("Overview", first): shown when /me says `global` (the user holds a global role); it opens admin.
// TODO(api): /me does not list the operator portal, vendor outlets or Finance yet; those tiles come once it does.
const { config } = useOpsShell()
const { me, can } = useMe()
const { slug } = useWorkspace()
const { appAddress } = useAppAddress()
const route = useRoute()
const preview = computed(() => !useRuntimeConfig().public.apiBase)
const open = ref(false)

interface Tile {
    key: string
    name: string
    type: string
    icon: string
    /** Tailwind classes for the coloured square. */
    tone: string
    current: boolean
    /** Same app: a path. Another app: its full address. Null when there is nowhere to go (e.g. on localhost). */
    to: string | null
    external: boolean
}

// Order and colours from doc 09: Global first, then bus (blue), taxi (amber), fleet (green), e-hailing.
const TYPES: Record<string, { label: string; icon: string; tone: string; order: number; app: string; locationInPath: boolean }> = {
    bus_terminal: { label: 'Bus CTS', icon: 'i-bx-bus', tone: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', order: 1, app: 'bus', locationInPath: true },
    taxi: { label: 'Taxi', icon: 'i-bx-taxi', tone: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', order: 2, app: 'taxi', locationInPath: true },
    fleet: { label: 'Fleet', icon: 'i-bx-car', tone: 'bg-green-500/15 text-green-600 dark:text-green-400', order: 3, app: 'fleet', locationInPath: false },
    ride: { label: 'E-hailing', icon: 'i-bx-map', tone: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', order: 4, app: 'ride', locationInPath: false },
}

function target(workspace: WorkspaceRef): { to: string | null; external: boolean } {
    const type = TYPES[workspace.type]!
    if (type.app === config.app) {
        // Same app: swap the location in the path and stay on the same page.
        if (!config.locationInPath || !slug.value) return { to: '/', external: false }
        return { to: route.fullPath.replace(`/${slug.value}`, `/${workspace.slug}`), external: false }
    }
    // Another app: its dashboard, at its own address (doc 09, "Switching").
    return { to: appAddress(type.app, type.locationInPath ? `/${workspace.slug}` : '/'), external: true }
}

/** Global (doc 09): first tile, for users with a global role; it opens the admin app's overview. */
function globalTile(): Tile {
    const current = config.app === 'admin'
    return {
        key: 'global',
        name: 'Global',
        type: 'Overview',
        icon: 'i-bx-globe',
        tone: 'bg-gray-500/15 text-gray-600 dark:text-gray-300',
        current,
        to: current ? '/' : appAddress('admin', '/'),
        external: !current,
    }
}

const tiles = computed<Tile[]>(() => [
    ...(me.value?.global ? [globalTile()] : []),
    ...(me.value?.workspaces ?? [])
        .filter((w) => TYPES[w.type])
        .sort((a, b) => TYPES[a.type]!.order - TYPES[b.type]!.order || a.name.localeCompare(b.name))
        .map((w) => ({
            key: w.slug,
            name: w.name,
            type: TYPES[w.type]!.label,
            icon: TYPES[w.type]!.icon,
            tone: TYPES[w.type]!.tone,
            current: config.app !== 'admin' && w.slug === slug.value,
            ...target(w),
        })),
])

const visible = computed(() => preview.value || tiles.value.length > 1)
const currentName = computed(() => tiles.value.find((t) => t.current)?.name ?? config.title)
const manageUrl = computed(() => (can('platform.workspaces.manage') ? appAddress('admin', '/global/workspaces') : null))

async function choose(tile: Tile) {
    if (!tile.to || tile.current) return
    open.value = false
    await navigateTo(tile.to, { external: tile.external })
}
</script>

<template>
    <UPopover v-if="visible" v-model:open="open" :content="{ align: 'end', sideOffset: 8 }">
        <button
            type="button"
            class="flex size-11 items-center justify-center rounded-full border border-(--ops-border) text-gray-500 transition-colors hover:bg-(--app-icon-bg) hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label="Switch workspace"
        >
            <UIcon name="i-bx-grid" class="size-5" />
        </button>

        <template #content>
            <div class="w-[min(320px,100vw-2rem)] p-4">
                <p class="font-semibold">Switch Workspace</p>
                <p class="mb-3 text-xs text-gray-500">Current: {{ currentName }}</p>

                <p v-if="tiles.length === 0" class="py-4 text-center text-sm text-gray-500">No workspaces yet.</p>
                <div v-else class="grid grid-cols-2 gap-2">
                    <button
                        v-for="tile in tiles"
                        :key="tile.key"
                        type="button"
                        class="relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors"
                        :class="[
                            tile.current ? 'border-primary' : 'border-(--ops-border) hover:bg-(--app-icon-bg)',
                            !tile.to && !tile.current ? 'cursor-not-allowed opacity-60' : '',
                        ]"
                        :title="!tile.to && !tile.current ? 'Opens in its own app (not available on localhost)' : undefined"
                        @click="choose(tile)"
                    >
                        <span class="flex size-9 items-center justify-center rounded-lg" :class="tile.tone">
                            <UIcon :name="tile.icon" class="size-5" />
                        </span>
                        <span class="w-full truncate text-sm font-medium">{{ tile.name }}</span>
                        <span class="text-xs text-gray-500">{{ tile.type }}</span>
                        <UIcon v-if="tile.current" name="i-bx-check-circle" class="absolute right-2 top-2 size-5 text-primary" />
                    </button>
                </div>

                <div v-if="manageUrl" class="mt-3 border-t border-(--ops-border) pt-3">
                    <a :href="manageUrl" class="text-sm font-medium text-primary hover:underline">Manage workspaces</a>
                </div>
            </div>
        </template>
    </UPopover>
</template>
