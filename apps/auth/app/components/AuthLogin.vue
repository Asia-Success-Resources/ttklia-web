<script setup lang="ts">
import type { WorkspaceRef } from '~~/../../layers/base/app/types/api'

// The single login (auth.ttklia.com/{workspace}, doc 16 "Login"). Signs in with the shared form (OpsLoginForm), then
// sends the user on:
// 1. to `?return=` when it is a page of one of our apps (same parent domain as this host), which the apps set when
//    they send a signed-out user here;
// 2. else to the app of [workspace]: bus terminals → bus.<domain>/?location=<slug>, taxi → taxi.<domain>/<slug>,
//    global → admin, fleet → fleet, ride → teeko;
// 3. with no workspace, or one the user holds no role in: the list of their workspaces to pick from.
// Already signed in (the shared cookie is valid): straight on, without the form.
const props = defineProps<{ workspace?: string | null }>()

const route = useRoute()
const { me } = useMe()
const { getToken, logout } = useAuth()
const { appAddress } = useAppAddress()

const checking = ref(true)
const signedIn = ref(false)
const pageError = ref('')

const slug = computed(() => (props.workspace ?? '').toLowerCase() || null)
const wanted = computed(() => (slug.value ? slug.value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null))

/** The workspaces the user can open, with the global one first when they hold a global role. */
const places = computed<WorkspaceRef[]>(() => {
    const list = [...(me.value?.workspaces ?? [])]
    if (me.value?.global && !list.some((w) => w.type === 'global')) {
        list.unshift({ slug: 'global', code: 'GLOBAL', name: 'Global', type: 'global' })
    }
    return list
})

function addressOf(w: WorkspaceRef): string | null {
    switch (w.type) {
        case 'global':
            return appAddress('admin', '/')
        case 'bus_terminal':
            return appAddress('bus', `/?location=${encodeURIComponent(w.slug)}`)
        case 'taxi':
            return appAddress('taxi', `/${encodeURIComponent(w.slug)}`)
        case 'fleet':
            return appAddress('fleet', '/')
        case 'ride':
            return appAddress('ride', '/')
        default:
            return null
    }
}

/** `?return=` only when it is one of our apps: this host's parent domain (auth.ttklia.com → *.ttklia.com). */
function returnAddress(): string | null {
    const back = route.query.return
    if (typeof back !== 'string' || !back) return null
    try {
        const url = new URL(back)
        const here = window.location.hostname
        if (here === 'localhost' || here === '127.0.0.1') return url.hostname === here ? url.href : null
        const parent = here.split('.').slice(1).join('.')
        const ok = (url.protocol === 'https:' || url.protocol === 'http:') && (url.hostname === parent || url.hostname.endsWith(`.${parent}`))
        return ok ? url.href : null
    } catch {
        return null
    }
}

function go(address: string) {
    window.location.assign(address)
}

/** After sign-in: back to the page they came from, or the workspace's app, else stay on the list. */
function continueOn() {
    signedIn.value = true
    const back = returnAddress()
    if (back) return go(back)
    const target = slug.value ? places.value.find((w) => w.slug === slug.value) : places.value.length === 1 ? places.value[0] : null
    const address = target ? addressOf(target) : null
    if (address) return go(address)
}

onMounted(async () => {
    try {
        if (await getToken({ redirect: false })) continueOn()
    } catch {
        pageError.value = 'Unable to reach the sign-in service. Please try again.'
    } finally {
        checking.value = false
    }
})

async function signOut() {
    signedIn.value = false
    await logout(route.fullPath)
}

const typeLabel: Record<string, string> = { global: 'Admin', bus_terminal: 'Bus terminal', taxi: 'Taxi', fleet: 'Fleet', ride: 'Teeko' }
const typeIcon: Record<string, string> = { global: 'i-bx-cog', bus_terminal: 'i-bx-bus', taxi: 'i-bx-taxi', fleet: 'i-bx-car', ride: 'i-bx-map' }
</script>

<template>
    <div v-if="checking" class="flex min-h-screen items-center justify-center bg-(--ops-body)">
        <UIcon name="i-bx-loader-lines" class="size-8 animate-spin text-gray-400" />
    </div>

    <!-- Signed in but not sent on: no workspace given, it is not one of theirs, or they hold several -->
    <div v-else-if="signedIn" class="flex min-h-screen items-center justify-center bg-(--ops-body) px-4">
        <div class="w-full max-w-lg rounded-2xl border border-(--ops-border) bg-(--ops-card) p-8">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white/90">Choose where to go</h1>
            <p class="mt-1 text-sm text-gray-500">Signed in as {{ me?.name }}.</p>
            <UAlert
                v-if="slug && !places.some((w) => w.slug === slug)"
                class="mt-4"
                color="warning"
                variant="soft"
                icon="i-bx-error"
                :title="`You have no access to ${wanted}.`"
                description="Ask an admin to give you a role there, or open one of your workspaces below."
            />
            <div class="mt-6 space-y-2">
                <button
                    v-for="w in places"
                    :key="w.slug"
                    type="button"
                    class="flex w-full items-center gap-3 rounded-xl border border-(--ops-border) px-4 py-3 text-left hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                    :disabled="!addressOf(w)"
                    @click="go(addressOf(w)!)"
                >
                    <UIcon :name="typeIcon[w.type] ?? 'i-bx-buildings'" class="size-6 text-primary" />
                    <span class="flex-1">
                        <span class="block font-semibold text-gray-800 dark:text-white/90">{{ w.name }}</span>
                        <span class="block text-xs text-gray-500">{{ typeLabel[w.type] ?? w.type }}</span>
                    </span>
                    <UIcon name="i-bx-chevron-right" class="size-5 text-gray-400" />
                </button>
                <p v-if="!places.length" class="text-sm text-gray-500">You have no workspace yet. Ask an admin to give you a role.</p>
            </div>
            <UButton class="mt-6" label="Sign out" color="neutral" variant="outline" icon="i-bx-log-out" @click="signOut" />
        </div>
    </div>

    <OpsLoginForm v-else :subtitle="wanted ? `to ${wanted}` : undefined" @signed-in="continueOn">
        <UAlert v-if="pageError" class="mb-4" :description="pageError" color="error" variant="subtle" />
    </OpsLoginForm>
</template>
