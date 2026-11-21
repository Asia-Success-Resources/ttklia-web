<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Users: staff accounts in every workspace (v2 Admin\UserController@index). Permission: global.users.read (doc 27).
// GET /api/admin/users: staff are the users holding a role; customers and drivers are listed elsewhere.
useHead({ title: 'Users' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    email: string | null
    phone_e164: string | null
    status: string
    roles: string[]
    last_login_at: string | null
}

const { can } = useMe()
const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.original.email ?? '-' },
    { accessorKey: 'phone_e164', header: 'Phone No', cell: ({ row }) => row.original.phone_e164 ?? '-' },
    { accessorKey: 'roles', header: 'Roles', cell: ({ row }) => row.original.roles.join(', ') || '-' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'last_login_at', header: 'Last login' },
    { id: 'open', header: '', cell: ({ row }) => h(resolveComponent('UButton'), { label: 'Open', variant: 'link', size: 'sm', to: `/global/users/${row.original.uuid}` }) },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/users' })
onMounted(() => list.load())

// Status picker (fleet-management style): active ↔ suspended. Suspending signs the user out; their roles stay.
const api = useApi()
const toast = useToast()
async function changeStatus(row: Row, status: string) {
    const previous = row.status
    row.status = status
    try {
        await api.patch(`/admin/users/${row.uuid}`, { status })
        toast.add({ title: `${row.name} is now ${status}`, color: 'success' })
    } catch (e) {
        row.status = previous
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to update status', color: 'error' })
    }
}
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Users"
        subject="users"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :create-to="can('global.users.write') ? '/global/users/new' : undefined"
        :status-options="can('global.users.write') ? ['active', 'suspended'] : []"
        @status="changeStatus"
        @page="list.load"
    />
</template>
