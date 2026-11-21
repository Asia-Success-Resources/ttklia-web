<script setup lang="ts">
// A staff user's role assignments (table `user_roles`, doc 27): each row is a role, plus the workspace it is used in
// (bus, taxi, fleet and ride roles) or the bus company it is limited to (operator portal roles). Global roles need
// neither. ttklia-v2 had one role and a list of workspaces per user; here each role names its own workspace.
export interface Assignment { role_id: number | null; workspace_id: number | null; scope_organisation_id: number | null }
interface Role { id: number; name: string; workspace_type: string | null; workspace_ids?: number[] }
interface Workspace { id?: number; code: string; name: string; type: string }
interface Company { id: number; name: string | null }

const assignments = defineModel<Assignment[]>({ required: true })

const roles = useApiAll<Role>({ path: '/admin/roles' })
const workspaces = useApiAll<Workspace & { id: number }>({ path: '/admin/workspaces' })
const companies = useApiAll<Company>({ path: '/admin/finance/organisations', query: { type: 'bus_operator' } })
onMounted(() => {
    roles.load()
    workspaces.load()
    companies.load()
})

const roleOf = (a: Assignment) => roles.rows.value.find((r) => r.id === a.role_id) ?? null
// Only the workspaces the role can be given in: its Workspace Access (any kind), or with none set every one of its kind.
const workspacesFor = (a: Assignment) => {
    const role = roleOf(a)
    const only = role?.workspace_ids ?? []
    return workspaces.rows.value.filter((w) => (only.length ? only.includes(w.id) : w.type === role?.workspace_type))
}
const roleItems = computed(() => roles.rows.value.map((r) => ({ label: `${r.name} · ${r.workspace_type?.replace('_', ' ') ?? 'several kinds'}`, value: r.id })))

function add() {
    assignments.value = [...assignments.value, { role_id: null, workspace_id: null, scope_organisation_id: null }]
}
function remove(i: number) {
    assignments.value = assignments.value.filter((_, j) => j !== i)
}
</script>

<template>
    <div class="space-y-3">
        <div v-for="(a, i) in assignments" :key="i" class="grid grid-cols-1 gap-3 rounded-lg border border-(--ops-border) p-3 md:grid-cols-[1fr_1fr_auto]">
            <USelectMenu :model-value="a.role_id ?? undefined" :items="roleItems" value-key="value" placeholder="Role" class="w-full"
                @update:model-value="(v: number) => { a.role_id = v ?? null; a.workspace_id = null; a.scope_organisation_id = null }" />
            <template v-if="roleOf(a)?.workspace_type === 'operator_portal'">
                <USelectMenu :model-value="a.scope_organisation_id ?? undefined" @update:model-value="(v: number) => (a.scope_organisation_id = v ?? null)" :items="companies.rows.value.map((c) => ({ label: c.name ?? `#${c.id}`, value: c.id }))"
                    value-key="value" placeholder="Bus company" class="w-full" />
            </template>
            <template v-else-if="roleOf(a) && roleOf(a)!.workspace_type !== 'global'">
                <USelectMenu :model-value="a.workspace_id ?? undefined" @update:model-value="(v: number) => (a.workspace_id = v ?? null)" :items="workspacesFor(a).map((w) => ({ label: `${w.name} (${w.code})`, value: w.id }))"
                    value-key="value" placeholder="Workspace" class="w-full" />
            </template>
            <div v-else class="flex items-center text-sm text-gray-500">{{ roleOf(a) ? 'Every workspace' : '' }}</div>
            <UButton icon="i-bx-trash" color="error" variant="ghost" aria-label="Remove" @click="remove(i)" />
        </div>
        <UButton label="Add role" icon="i-bx-plus" variant="outline" size="sm" @click="add" />
    </div>
</template>
