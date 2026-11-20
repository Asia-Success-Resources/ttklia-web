<script setup lang="ts">
import type { OpsMenuGroup, OpsMenuItem } from '../types/ops'

// Logo, workspace badge, then menu groups with uppercase titles that fold open;
// pending counts roll up onto the group (doc 09, "Sidebar").
const { config, collapsed, mobileOpen, resolveTo } = useOpsShell()
const { groups } = useOpsMenu()
const { counts } = useOpsCounts()
const { me } = useMe()
const { bootstrap } = useBootstrap()
const { slug } = useWorkspace()
const route = useRoute()

/**
 * Sidebar name and logo (ops.brand in app.config.ts). The name defaults to the module's own title and the logo to
 * /logo.png in the module's own public/ folder; the icon only shows while that image is missing.
 */
const brand = computed(() => ({ name: config.title, icon: 'i-bx-shapes', logo: '/logo.png', ...config.brand }))
const logoFailed = ref(false)
watch(() => brand.value.logo, () => (logoFailed.value = false))

const folded = useState<Record<string, boolean>>('ops-sidebar-folded', () => ({}))

const workspaceName = computed(() => {
    const fromMe = me.value?.workspaces.find((w) => w.slug === slug.value)?.name
    return fromMe ?? bootstrap.value?.workspace?.name ?? slug.value ?? config.title
})

function itemCount(item: OpsMenuItem): number {
    return item.countKey ? (counts.value[item.countKey] ?? 0) : 0
}

function groupCount(group: OpsMenuGroup): number {
    return group.items.reduce((sum, item) => sum + itemCount(item), 0)
}

function matches(item: OpsMenuItem): boolean {
    const target = resolveTo(item.to)
    return route.path === target || (item.to !== '/' && route.path.startsWith(`${target}/`))
}

/** The menu item closest to this page: on /limo/pending that is "Pending", not "Limo" as well. */
const activeTo = computed(() =>
    groups.value
        .flatMap((group) => group.items)
        .filter(matches)
        .map((item) => resolveTo(item.to))
        .sort((a, b) => b.length - a.length)[0] ?? null,
)

function isActive(item: OpsMenuItem): boolean {
    return resolveTo(item.to) === activeTo.value
}

function toggle(title: string) {
    folded.value[title] = !folded.value[title]
}
</script>

<template>
    <aside
        class="fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-(--ops-border) bg-(--ops-sidebar) px-5 transition-all duration-300"
        :class="[
            collapsed ? 'lg:w-[90px]' : 'lg:w-[290px]',
            mobileOpen ? 'w-[290px] translate-x-0' : '-translate-x-full lg:translate-x-0',
        ]"
    >
        <div class="flex items-center gap-2 py-8" :class="collapsed ? 'lg:justify-center' : ''">
            <img
                v-if="brand.logo && !logoFailed"
                :src="brand.logo"
                :alt="brand.name"
                class="size-8 object-contain"
                @error="logoFailed = true"
            />
            <UIcon v-else :name="brand.icon" class="size-8 text-primary" />
            <span v-if="!collapsed" class="text-lg font-semibold">{{ brand.name }}</span>
        </div>

        <div
            class="mb-6 flex items-center gap-3 rounded-lg bg-(--ops-badge-bg) px-3 py-2 text-(--ops-badge-fg)"
            :class="collapsed ? 'lg:justify-center lg:px-0' : ''"
        >
            <UIcon :name="config.badgeIcon" class="size-5 shrink-0" />
            <span v-if="!collapsed" class="truncate text-sm font-medium">{{ workspaceName }}</span>
        </div>

        <nav class="scrollbar-hidden flex-1 overflow-y-auto overflow-x-hidden pb-6">
            <div v-for="group in groups" :key="group.title" class="mb-4">
                <button
                    type="button"
                    class="mb-2 flex w-full items-center justify-between text-xs uppercase leading-5 text-gray-400"
                    :class="collapsed ? 'lg:justify-center' : ''"
                    @click="toggle(group.title)"
                >
                    <span v-if="!collapsed">{{ group.title }}</span>
                    <UIcon v-else name="i-bx-dots-horizontal-rounded" class="size-5" />
                    <span v-if="!collapsed" class="flex items-center gap-2">
                        <UBadge v-if="groupCount(group) > 0" :label="String(groupCount(group))" size="sm" variant="soft" />
                        <UIcon :name="folded[group.title] ? 'i-bx-chevron-right' : 'i-bx-chevron-down'" class="size-4" />
                    </span>
                </button>
                <ul v-show="!folded[group.title]" class="flex flex-col gap-1">
                    <li v-for="item in group.items" :key="item.to">
                        <NuxtLink
                            :to="resolveTo(item.to)"
                            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
                            :class="[
                                isActive(item)
                                    ? 'bg-(--ops-nav-active-bg) text-(--ops-nav-active-fg)'
                                    : 'text-(--ops-nav-fg) hover:bg-(--ops-nav-hover-bg) hover:text-(--ops-nav-hover-fg)',
                                collapsed ? 'lg:justify-center' : '',
                            ]"
                            @click="mobileOpen = false"
                        >
                            <UIcon :name="item.icon ?? 'i-bx-circle'" class="size-5 shrink-0" />
                            <span v-if="!collapsed" class="flex-1 truncate">{{ item.label }}</span>
                            <UBadge v-if="!collapsed && itemCount(item) > 0" :label="String(itemCount(item))" size="sm" />
                        </NuxtLink>
                    </li>
                </ul>
            </div>
        </nav>
    </aside>
</template>
