<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Roles (doc 27), with the workspaces each can be given in, and how many permissions and people each has. A new role
// is named here, then its Workspace Access and permissions are set on its page.
// GET/POST /api/admin/roles. Permission: global.roles.read / .write (doc 27).
useHead({ title: 'Roles' })

interface Row extends Record<string, unknown> {
    id: number
    workspace_type: string | null
    workspace_codes: string | null
    name: string
    description: string | null
    is_system: boolean
    permissions_count: number
    users_count: number
}

const { can } = useMe()
const api = useApi()
const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Role' },
    // {
    //     accessorKey: 'workspace_codes',
    //     header: 'Workspaces',
    //     cell: ({ row }) => row.original.workspace_codes ?? (row.original.workspace_type ? `Every ${row.original.workspace_type.replace('_', ' ')}` : '-'),
    // },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '-' },
    { accessorKey: 'permissions_count', header: 'Permissions' },
    { accessorKey: 'users_count', header: 'People' },
    // { accessorKey: 'is_system', header: 'Built in', cell: ({ row }) => (row.original.is_system ? 'Yes' : '') },
    // View opens the role read-only; Edit (with global.roles.write) opens it to change.
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
            const UButton = resolveComponent('UButton')
            const to = `/global/roles/${row.original.id}`
            return h('div', { class: 'flex justify-end gap-2' }, [
                h(UButton, { label: 'View', icon: 'i-bx-eye', color: 'primary', variant: 'soft', size: 'sm', to: `${to}?mode=view` }),
                can('global.roles.write') ? h(UButton, { label: 'Edit', icon: 'i-bx-edit', color: 'success', variant: 'soft', size: 'sm', to }) : null,
            ])
        },
    },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/roles' })
onMounted(() => list.load())

// The new-role popup, fleet-management style (useFormModal / OpsFormModal).
const { form: create, fieldError, show: showCreate, submit } = useFormModal(() => ({ name: '', kind: 'staff', description: '' }))
const kinds = [
    { label: 'Staff (choose workspaces next)', value: 'staff' },
    { label: 'Operator portal (one bus company)', value: 'operator_portal' },
]

async function save() {
    let id: number | null = null
    const saved = await submit(async (d) => {
        id = (
            await api.post<{ data: { id: number } }>('/admin/roles', {
                name: d.name,
                description: d.description || null,
                workspace_type: d.kind === 'operator_portal' ? 'operator_portal' : null,
            })
        ).data.id
    })
    if (saved && id) await navigateTo(`/global/roles/${id}`)
}
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Roles"
        subject="roles"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('global.roles.write')" label="Create" icon="i-bx-plus" @click="showCreate()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="create.open" title="New Role" :saving="create.saving" :error="create.error" submit-label="Create and Set Access" @submit="save">
        <OpsFormField label="Name" required :error="fieldError('name')"><UInput v-model="create.data.name" class="w-full" /></OpsFormField>
        <OpsFormField label="Kind" required :error="fieldError('workspace_type')"><USelect v-model="create.data.kind" :items="kinds" class="w-full" /></OpsFormField>
        <OpsFormField label="Description" full :error="fieldError('description')"><UInput v-model="create.data.description" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
