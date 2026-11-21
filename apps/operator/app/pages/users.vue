<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Users: company staff (company admin) (table `user_roles`). Permission: operator.users.read (doc 27).
// GET /api/operator-portal/users (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Users' })

interface Row extends Record<string, unknown> {
    uuid: string
    scope: string
    granted_by: number
    expires_at: string | null
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'scope', header: 'Scope' },
    { accessorKey: 'granted_by', header: 'Granted by' },
    { accessorKey: 'expires_at', header: 'Expires at' },
    { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/operator-portal/users' })
onMounted(() => list.load())
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
    
        @page="list.load"
    />
</template>
