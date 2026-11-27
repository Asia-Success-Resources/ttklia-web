<script setup lang="ts">
// One role, in ttklia-v2's layout. From the top:
// 1. Role: name and description.
// 2. Workspace Access (v2's users/form-after.blade.php cards): every workspace, of any kind; tick as many as needed
//    (table role_workspaces). The role can only be given in the ticked ones.
// 3. Permissions (v2's roles/form-after.blade.php), shown once a workspace is ticked, with a coloured section for each
//    kind ticked (Global: global, finance, platform, vendors; a bus terminal: bus; …). Each screen is a small card with
//    an "All" box and one box per action. Permissions of kinds no longer ticked are dropped on save.
// Super Admin always holds everything and cannot be changed. Operator portal roles have no workspace (one company).
// GET/PATCH/DELETE /api/admin/roles/{id}, PUT …/workspaces, PUT …/permissions. Permission: global.roles.read / .write.
useHead({ title: 'Role' })

interface Entry { name: string; action: string; sensitive: boolean }
interface Workspace { id: number; code: string; slug: string; name: string; type: string; is_active: boolean }
interface Role {
    id: number
    name: string
    description: string | null
    workspace_type: string | null
    is_system: boolean
    users_count: number
    permissions: string[]
    catalogue: Record<string, Record<string, Entry[]>>
    workspaces: number[]
    available_workspaces: Workspace[]
}

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const api = useApi()
const { can } = useMe()

const role = ref<Role | null>(null)
const selected = ref<Set<string>>(new Set())
const access = ref<Set<number>>(new Set())
const name = ref('')
const description = ref('')
const busy = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)

const locked = computed(() => !!role.value && role.value.is_system && role.value.name === 'Super Admin')
// ?mode=view (the list's View button) opens it read-only; Edit opens it to change.
const viewing = computed(() => route.query.mode === 'view')
const canWrite = computed(() => can('global.roles.write') && !locked.value && !viewing.value)
const isOperator = computed(() => role.value?.workspace_type === 'operator_portal')

// Each kind of workspace: its look (as v2) and the permission modules that apply there.
const KINDS: Record<string, { label: string; icon: string; color: string; modules: string[] }> = {
    global: { label: 'Global', icon: 'i-bx-globe', color: 'gray', modules: ['global', 'finance', 'platform', 'vendors', 'vendor'] },
    bus_terminal: { label: 'Bus CTS', icon: 'i-bx-bus', color: 'blue', modules: ['bus'] },
    taxi: { label: 'Taxi', icon: 'i-bx-taxi', color: 'amber', modules: ['taxi'] },
    fleet: { label: 'Fleet Management', icon: 'i-bx-car', color: 'emerald', modules: ['fleet'] },
    ride: { label: 'Teeko', icon: 'i-bx-car', color: 'purple', modules: ['ride'] },
    operator_portal: { label: 'Operator Portal', icon: 'i-bx-briefcase', color: 'blue', modules: ['operator'] },
}
const kind = (type: string) => KINDS[type] ?? { label: titleCase(type), icon: 'i-bx-cube', color: 'gray', modules: [] }

// Permission sections, one per module.
const SECTIONS: Record<string, { label: string; icon: string; color: string }> = {
    global: { label: 'Global', icon: 'i-bx-globe', color: 'gray' },
    finance: { label: 'Finance', icon: 'i-bx-wallet', color: 'emerald' },
    platform: { label: 'Platform', icon: 'i-bx-cog', color: 'gray' },
    vendors: { label: 'Vendors', icon: 'i-bx-store', color: 'purple' },
    vendor: { label: 'Vendor Portal', icon: 'i-bx-store', color: 'purple' },
    bus: { label: 'Bus CTS', icon: 'i-bx-bus', color: 'blue' },
    taxi: { label: 'Taxi', icon: 'i-bx-taxi', color: 'amber' },
    fleet: { label: 'Fleet Management', icon: 'i-bx-car', color: 'emerald' },
    ride: { label: 'Teeko', icon: 'i-bx-car', color: 'purple' },
    operator: { label: 'Operator Portal', icon: 'i-bx-briefcase', color: 'blue' },
}
const COLORS: Record<string, { band: string; text: string; icon: string; card: string; on: string; iconOn: string; iconOff: string; badge: string }> = {
    gray: {
        band: 'bg-gray-50 dark:bg-white/[0.03]', text: 'text-gray-800 dark:text-white/90', icon: 'text-primary', card: 'border-(--ops-border)',
        on: 'border-gray-400 bg-gray-50 dark:border-gray-500 dark:bg-gray-800', iconOn: 'bg-gray-600 text-white', iconOff: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    },
    blue: {
        band: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500', card: 'border-blue-100 dark:border-blue-500/20',
        on: 'border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10', iconOn: 'bg-blue-500 text-white', iconOff: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    },
    amber: {
        band: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500', card: 'border-amber-100 dark:border-amber-500/20',
        on: 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10', iconOn: 'bg-amber-500 text-white', iconOff: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    },
    emerald: {
        band: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500', card: 'border-emerald-100 dark:border-emerald-500/20',
        on: 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10', iconOn: 'bg-emerald-500 text-white', iconOff: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
    purple: {
        band: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500', card: 'border-purple-100 dark:border-purple-500/20',
        on: 'border-purple-300 bg-purple-50 dark:border-purple-500/40 dark:bg-purple-500/10', iconOn: 'bg-purple-500 text-white', iconOff: 'bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    },
}
const colorsOf = (color: string) => COLORS[color] ?? COLORS.gray!
const section = (m: string) => SECTIONS[m] ?? { label: titleCase(m), icon: 'i-bx-cube', color: 'gray' }

function titleCase(s: string) {
    return s.replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
// A screen's name from its permission resource: "customers.pii" → "Customers · Personal Data",
// "finance_einvoices" → "Finance E-Invoices".
const WORDS: Record<string, string> = { Einvoices: 'E-Invoices', Einvoice: 'E-Invoice', Pii: 'Personal Data', Pos: 'POS', Sst: 'SST', Api: 'API', Otp: 'OTP', H3: 'H3' }
// Resources whose names alone are easy to mix up (bus and taxi): "counter" is selling at the counter, "counters" is
// the list where counters are added.
const LABELS: Record<string, string> = { counters: 'Counters (add counter)' }
const HINTS: Record<string, string> = {
    counter: 'Selling at the counter: the sale screen and the staff member\'s own cash session.',
    counters: 'The Counters list: add, rename or remove the counters staff pick when they start a session.',
}
const resourceLabel = (resource: string) =>
    LABELS[resource] ??
    resource
        .split('.')
        .map((part) => titleCase(part).split(' ').map((w) => WORDS[w] ?? w).join(' '))
        .join(' · ')
const resourceHint = (resource: string) =>
    HINTS[resource] ??
    (resource.endsWith('.pii') ? 'Personal data: see IC, passport, phone and e-mail unmasked. Each unmasked record viewed is logged (doc 27).' : undefined)

// ---------------------------------------------------------------- Workspace Access
function toggleAccess(wsId: number) {
    if (!canWrite.value) return
    const next = new Set(access.value)
    next.has(wsId) ? next.delete(wsId) : next.add(wsId)
    access.value = next
}
function toggleAllAccess() {
    const ids = role.value?.available_workspaces.map((w) => w.id) ?? []
    access.value = ids.every((i) => access.value.has(i)) ? new Set() : new Set(ids)
}
const accessChanged = computed(() => {
    const before = role.value?.workspaces ?? []
    return before.length !== access.value.size || before.some((i) => !access.value.has(i))
})

// ---------------------------------------------------------------- Permissions
// The modules shown: those of the kinds of workspace ticked (all of them for Super Admin).
const modules = computed(() => {
    if (!role.value) return []
    const all = Object.keys(role.value.catalogue)
    if (locked.value) return all
    const kinds = isOperator.value
        ? ['operator_portal']
        : [...new Set(role.value.available_workspaces.filter((w) => access.value.has(w.id)).map((w) => w.type))]
    const wanted = new Set(kinds.flatMap((k) => kind(k).modules))
    return all.filter((m) => wanted.has(m))
})
const showPermissions = computed(() => locked.value || isOperator.value || access.value.size > 0)
const resourcesOf = (m: string) => Object.entries(role.value?.catalogue[m] ?? {})
const has = (p: string) => locked.value || selected.value.has(p)
const allIn = (entries: Entry[]) => entries.length > 0 && entries.every((e) => has(e.name))
function set(names: string[], on: boolean) {
    const next = new Set(selected.value)
    for (const n of names) on ? next.add(n) : next.delete(n)
    selected.value = next
}
const toggle = (p: string) => set([p], !selected.value.has(p))
const toggleCard = (entries: Entry[]) => set(entries.map((e) => e.name), !allIn(entries))
const namesOf = (m: string) => resourcesOf(m).flatMap(([, entries]) => entries.map((e) => e.name))
function toggleSection(m: string) {
    const names = namesOf(m)
    set(names, !names.every((n) => selected.value.has(n)))
}
function toggleEverything() {
    const names = modules.value.flatMap(namesOf)
    set(names, !names.every((n) => selected.value.has(n)))
}

// ---------------------------------------------------------------- Load and save
async function load() {
    try {
        const res = await api.get<{ data: Role }>(`/admin/roles/${id.value}`)
        role.value = res.data
        selected.value = new Set(res.data.permissions)
        access.value = new Set(res.data.workspaces)
        name.value = res.data.name
        description.value = res.data.description ?? ''
    } catch (e) {
        error.value = toProblem(e)?.detail ?? 'Unable to load the role.'
    }
}
onMounted(load)

async function save() {
    if (!isOperator.value && !access.value.size) {
        error.value = 'Choose at least one workspace under Workspace Access.'
        return
    }
    busy.value = true
    error.value = null
    notice.value = null
    try {
        if (role.value && (name.value !== role.value.name || description.value !== (role.value.description ?? ''))) {
            await api.patch(`/admin/roles/${id.value}`, { name: name.value, description: description.value || null })
        }
        if (!isOperator.value && accessChanged.value) await api.put(`/admin/roles/${id.value}/workspaces`, { workspaces: [...access.value] })
        // Only the permissions of the sections shown are kept.
        const shown = new Set(modules.value.flatMap(namesOf))
        await api.put(`/admin/roles/${id.value}/permissions`, { permissions: [...selected.value].filter((p) => shown.has(p)) })
        notice.value = 'Saved. People holding this role get the change on their next page load.'
        await load()
    } catch (e) {
        const p = toProblem(e) as { message?: string; detail?: string } | null
        error.value = p?.message ?? p?.detail ?? 'Unable to save.'
    } finally {
        busy.value = false
    }
}

async function remove() {
    if (!confirm('Delete this role?')) return
    busy.value = true
    try {
        await api.del(`/admin/roles/${id.value}`)
        await navigateTo('/global/roles')
    } catch (e) {
        error.value = toProblem(e)?.detail ?? 'Unable to delete the role.'
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div>
        <OpsBreadcrumb :title="role?.name ?? 'Role'" />
        <UAlert v-if="locked" class="mb-4" color="info" variant="soft" title="Super Admin always has every permission in every workspace and cannot be changed." />
        <UAlert v-if="notice" class="mb-4" color="success" variant="soft" :title="notice" />
        <UAlert v-if="error" class="mb-4" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />

        <template v-if="role">
            <!-- 1. Role -->
            <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card)">
                <div class="flex items-center justify-between border-b border-(--ops-border) px-6 py-4">
                    <h2 class="text-lg font-medium text-gray-800 dark:text-white">Role</h2>
                    <span class="text-sm text-gray-500">{{ role.users_count }} people hold this role</span>
                </div>
                <div class="grid grid-cols-1 gap-5 p-4 sm:p-6 md:grid-cols-2">
                    <UFormField label="Name" required><UInput v-model="name" :disabled="!canWrite || role.is_system" class="w-full" /></UFormField>
                    <UFormField label="Description"><UInput v-model="description" :disabled="!canWrite" class="w-full" /></UFormField>
                </div>
            </div>

            <!-- 2. Workspace Access, as v2 -->
            <div v-if="!isOperator" class="mt-5 rounded-2xl border border-(--ops-border) bg-(--ops-card)">
                <div class="flex items-center justify-between border-b border-(--ops-border) px-6 py-4">
                    <h2 class="text-lg font-medium text-gray-800 dark:text-white">Workspace Access</h2>
                    <button v-if="canWrite" type="button" class="text-xs font-medium text-primary transition hover:opacity-80" @click="toggleAllAccess">Toggle All</button>
                </div>
                <div class="p-4 sm:p-6">
                    <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
                        Select which workspaces this role can be given in. You can pick several, of any kind; the permissions for each kind appear below. People who
                        already hold the role in a workspace you untick keep it until they are moved.
                    </p>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <button
                            v-for="ws in role.available_workspaces"
                            :key="ws.id"
                            type="button"
                            role="checkbox"
                            :aria-checked="locked || access.has(ws.id)"
                            :disabled="!canWrite"
                            class="relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-sm disabled:cursor-default"
                            :class="locked || access.has(ws.id) ? colorsOf(kind(ws.type).color).on : 'border-gray-200 dark:border-gray-700'"
                            @click="toggleAccess(ws.id)"
                        >
                            <span
                                class="flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors"
                                :class="locked || access.has(ws.id) ? colorsOf(kind(ws.type).color).iconOn : colorsOf(kind(ws.type).color).iconOff"
                            >
                                <UIcon :name="kind(ws.type).icon" class="size-[22px]" />
                            </span>
                            <span class="min-w-0 flex-1">
                                <span class="block truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ ws.name }}</span>
                                <span class="rounded-md px-1.5 py-0.5 text-xs" :class="colorsOf(kind(ws.type).color).badge">{{ kind(ws.type).label }} · {{ ws.code }}</span>
                                <span v-if="!ws.is_active" class="ml-1 text-xs text-gray-400">inactive</span>
                            </span>
                            <span
                                class="flex size-5 items-center justify-center rounded-full transition-all"
                                :class="locked || access.has(ws.id) ? 'scale-100 bg-primary text-white' : 'scale-75 bg-gray-200 opacity-50 dark:bg-gray-700'"
                            >
                                <UIcon name="i-bx-check" class="size-3.5" />
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            <UAlert v-else class="mt-5" color="info" variant="soft" title="An operator portal role is limited to one bus company when it is given to someone, not to a workspace." />

            <!-- 3. Permissions, as v2: only once a workspace is ticked -->
            <div v-if="showPermissions" class="mt-5 overflow-hidden rounded-2xl border border-(--ops-border) bg-(--ops-card)">
                <div class="flex items-center justify-between px-6 py-4">
                    <h2 class="text-lg font-medium text-gray-800 dark:text-white">Permissions</h2>
                    <button v-if="canWrite" type="button" class="text-xs font-medium text-primary transition hover:opacity-80" @click="toggleEverything">Toggle All</button>
                </div>

                <div v-for="m in modules" :key="m" class="border-t border-(--ops-border)">
                    <div class="flex items-center justify-between px-6 py-4" :class="colorsOf(section(m).color).band">
                        <h2 class="flex items-center gap-2 text-lg font-medium" :class="colorsOf(section(m).color).text">
                            <UIcon :name="section(m).icon" class="size-5" />
                            {{ section(m).label }} Permissions
                        </h2>
                        <button v-if="canWrite" type="button" class="text-xs font-medium transition hover:opacity-80" :class="colorsOf(section(m).color).text" @click="toggleSection(m)">
                            Toggle All
                        </button>
                    </div>

                    <div class="grid grid-cols-1 gap-3 p-4 sm:p-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <div v-for="[resource, entries] in resourcesOf(m)" :key="resource" class="rounded-xl border p-3" :class="colorsOf(section(m).color).card">
                            <div class="mb-2 flex items-center justify-between">
                                <h3 class="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300" :title="resourceHint(resource)">
                                    <UIcon :name="resource.endsWith('.pii') ? 'i-bx-shield' : 'i-bx-cube'" class="mr-1 size-4" :class="colorsOf(section(m).color).icon" />{{ resourceLabel(resource) }}
                                </h3>
                                <label class="flex items-center gap-1" :class="canWrite ? 'cursor-pointer' : 'pointer-events-none'">
                                    <!-- Read-only: not `disabled` (the browser greys ticked and unticked alike), just not clickable. -->
                                    <input type="checkbox" class="size-3.5 rounded accent-(--ui-primary)" :checked="allIn(entries)" :tabindex="canWrite ? 0 : -1" :aria-readonly="!canWrite" @click="!canWrite && $event.preventDefault()" @change="canWrite && toggleCard(entries)" />
                                    <span class="text-[10px] text-gray-400">All</span>
                                </label>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <label v-for="e in entries" :key="e.name" class="inline-flex items-center gap-1.5" :class="canWrite ? 'cursor-pointer' : 'pointer-events-none'" :title="e.sensitive ? 'Sensitive: money or personal data' : e.name">
                                    <input type="checkbox" class="size-3.5 rounded accent-(--ui-primary)" :checked="has(e.name)" :tabindex="canWrite ? 0 : -1" :aria-readonly="!canWrite" @click="!canWrite && $event.preventDefault()" @change="canWrite && toggle(e.name)" />
                                    <!-- Granted: dark and bold; not granted: light, so the two are told apart at a glance. -->
                                    <span
                                        class="text-xs"
                                        :class="[
                                            has(e.name) ? 'font-semibold' : 'font-normal opacity-60',
                                            e.sensitive ? 'text-warning' : has(e.name) ? 'text-gray-800 dark:text-white/90' : 'text-gray-500 dark:text-gray-400',
                                        ]"
                                    >{{ titleCase(e.action) }}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="mt-5 rounded-2xl border border-dashed border-(--ops-border) px-6 py-8 text-center text-sm text-gray-500">
                Select at least one workspace above to choose this role's permissions.
            </div>

            <div class="mt-5 flex flex-wrap items-center gap-3">
                <UButton v-if="canWrite" label="Save" icon="i-bx-save" :loading="busy" @click="save" />
                <UButton label="Back" color="neutral" variant="outline" to="/global/roles" />
                <UButton
                    v-if="viewing && can('global.roles.write') && !locked"
                    label="Edit"
                    icon="i-bx-edit"
                    color="success"
                    variant="soft"
                    :to="`/global/roles/${id}`"
                />
                <UButton
                    v-if="canWrite && !role.is_system"
                    label="Delete"
                    icon="i-bx-trash"
                    color="error"
                    variant="soft"
                    class="ml-auto"
                    :disabled="role.users_count > 0"
                    @click="remove"
                />
            </div>
        </template>
    </div>
</template>
