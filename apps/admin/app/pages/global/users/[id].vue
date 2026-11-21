<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Assignment } from '~/components/AssignmentEditor.vue'

// One staff user: details and role assignments per workspace (v2 Admin\UserController@edit, ForcePasswordReset).
// GET/PATCH/DELETE /api/admin/users/{uuid}, PUT …/roles, POST …/reset-password. Permission: global.users.read / .write.
useHead({ title: 'User' })

interface Row extends Record<string, unknown> { role_id: number; role: string; workspace_type: string | null; workspace_id: number | null; workspace: string | null; scope_organisation_id: number | null; organisation: string | null }
interface StaffUser { uuid: string; name: string; email: string | null; phone_e164: string | null; locale: string; status: string; last_login_at: string | null; created_at: string; assignments: Row[] }

const route = useRoute()
const uuid = computed(() => String(route.params.id ?? ''))
const api = useApi()
const { can } = useMe()
const canWrite = computed(() => can('global.users.write'))

const user = ref<StaffUser | null>(null)
const error = ref<string | null>(null)
const busy = ref(false)
const notice = ref<string | null>(null)
const toast = useToast()
// Popups in the fleet-management style (useFormModal / OpsFormModal).
const { form: edit, fieldError, show: showEdit, submit: submitEdit } = useFormModal(() => ({ name: '', email: '', phone_e164: '', locale: 'en' }))
const { form: rolesForm, fieldError: roleError, show: showRoles, submit: submitRoles } = useFormModal(() => ({ assignments: [] as Assignment[] }))

const fields = computed(() => [
    { label: 'Name', value: user.value?.name ?? null },
    { label: 'Email', value: user.value?.email ?? null },
    { label: 'Phone No', value: user.value?.phone_e164 ?? null },
    { label: 'Language', value: user.value?.locale ?? null },
    { label: 'Status', value: user.value?.status ?? null },
    { label: 'Last login', value: user.value?.last_login_at ? formatDateTime(user.value.last_login_at) : null },
    { label: 'Created', value: user.value ? formatDateTime(user.value.created_at) : null },
])
const columns: TableColumn<Row>[] = [
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'workspace_type', header: 'Kind', cell: ({ row }) => row.original.workspace_type?.replace('_', ' ') ?? 'several kinds' },
    { accessorKey: 'workspace', header: 'Workspace / company', cell: ({ row }) => row.original.workspace ?? row.original.organisation ?? 'Every workspace' },
]

function message(e: unknown, fallback: string) {
    const p = toProblem(e) as { detail?: string; title?: string; message?: string } | null
    return p?.message ?? p?.detail ?? p?.title ?? fallback
}

async function load() {
    try {
        const res = await api.get<{ data: StaffUser }>(`/admin/users/${uuid.value}`)
        user.value = res.data
    } catch (e) {
        error.value = message(e, 'Unable to load the user.')
    }
}
onMounted(load)

function openEdit() {
    if (!user.value) return
    showEdit({ name: user.value.name, email: user.value.email ?? '', phone_e164: user.value.phone_e164 ?? '', locale: user.value.locale })
}
function openRoles() {
    showRoles({ assignments: (user.value?.assignments ?? []).map((a) => ({ role_id: a.role_id, workspace_id: a.workspace_id, scope_organisation_id: a.scope_organisation_id })) })
}
async function saveDetails() {
    if (await submitEdit((d) => api.patch(`/admin/users/${uuid.value}`, { ...d, phone_e164: d.phone_e164 || null }))) {
        toast.add({ title: 'User saved', color: 'success' })
        await load()
    }
}
async function saveRoles() {
    if (await submitRoles((d) => api.put(`/admin/users/${uuid.value}/roles`, { assignments: d.assignments.filter((a) => a.role_id) }))) {
        toast.add({ title: 'Roles saved', color: 'success' })
        await load()
    }
}
/** The first error of any assignment row, e.g. "Choose a bus_terminal workspace for Counter Staff." */
const assignmentError = computed(() => Object.entries(rolesForm.errors).find(([k]) => k.startsWith('assignments'))?.[1]?.[0] ?? null)

async function run(fn: () => Promise<unknown>, done?: string) {
    busy.value = true
    error.value = null
    notice.value = null
    try {
        await fn()
        if (done) notice.value = done
        await load()
    } catch (e) {
        error.value = message(e, 'Unable to save.')
    } finally {
        busy.value = false
    }
}

async function resetPassword() {
    if (!confirm('Give this user a new temporary password and sign them out everywhere?')) return
    await run(async () => {
        const res = await api.post<{ data: { temporary_password: string } }>(`/admin/users/${uuid.value}/reset-password`)
        notice.value = `New temporary password: ${res.data.temporary_password} (shown once).`
    })
}
async function deactivate() {
    if (!confirm('Deactivate this user? Their roles are removed and they are signed out.')) return
    await run(() => api.del(`/admin/users/${uuid.value}`), 'User deactivated.')
}
</script>

<template>
    <OpsDetailPage :title="user?.name ?? 'User'" :fields="fields">
        <template #actions>
            <template v-if="canWrite && user">
                <UButton label="Edit" icon="i-bx-edit" color="success" variant="soft" @click="openEdit" />
                <UButton label="Roles" icon="i-bx-key" color="primary" variant="soft" @click="openRoles" />
                <UButton label="Reset password" icon="i-bx-lock-open" color="warning" variant="soft" :loading="busy" @click="resetPassword" />
                <UButton v-if="user.status === 'active'" label="Deactivate" icon="i-bx-block" color="error" variant="soft" :loading="busy" @click="deactivate" />
            </template>
            <UAlert v-if="notice" class="w-full" color="success" variant="soft" :title="notice" />
            <UAlert v-if="error" class="w-full" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />
        </template>
        <template #body>
            <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
                <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Roles</h4>
                <UTable :data="user?.assignments ?? []" :columns="columns" empty="No roles: this user cannot open any staff screen." />
            </div>
        </template>
    </OpsDetailPage>

    <OpsFormModal v-model:open="edit.open" title="Edit User" :saving="edit.saving" :error="edit.error" submit-label="Save User" @submit="saveDetails">
        <OpsFormField label="Name" required :error="fieldError('name')"><UInput v-model="edit.data.name" class="w-full" /></OpsFormField>
        <OpsFormField label="Email" required :error="fieldError('email')"><UInput v-model="edit.data.email" type="email" class="w-full" /></OpsFormField>
        <OpsFormField label="Phone (+60…)" :error="fieldError('phone_e164')"><UInput v-model="edit.data.phone_e164" placeholder="+60123456789" class="w-full" /></OpsFormField>
        <OpsFormField label="Language" required :error="fieldError('locale')">
            <USelect v-model="edit.data.locale" :items="[{ label: 'English', value: 'en' }, { label: 'Bahasa Melayu', value: 'ms' }, { label: '中文', value: 'zh' }]" class="w-full" />
        </OpsFormField>
    </OpsFormModal>

    <OpsFormModal v-model:open="rolesForm.open" title="Roles" wide :saving="rolesForm.saving" :error="rolesForm.error" submit-label="Save Roles" @submit="saveRoles">
        <OpsFormField label="Role assignments" full :error="assignmentError ?? roleError('assignments')">
            <AssignmentEditor v-model="rolesForm.data.assignments" />
        </OpsFormField>
    </OpsFormModal>
</template>
