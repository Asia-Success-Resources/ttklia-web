<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Users: staff accounts, all workspaces (table `users`). Permission: global.users.read (doc 27).
// GET /api/v1/admin/users (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Users' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    email: string | null
    phone_e164: string | null
    locale: string
    status: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone_no', header: 'Phone No' },
    { accessorKey: 'locale', header: 'Locale' },
    { accessorKey: 'status', header: 'Status' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/admin/users' })
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
                :has-more="list.nextCursor.value !== null"
        
                @more="list.load(list.nextCursor.value ?? undefined)"
        />
</template>
