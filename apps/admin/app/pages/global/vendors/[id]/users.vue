<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vendor users: owner and managers (table `users`). Permission: vendors.manage (doc 32).
// API: none yet (doc 04, doc 32). TODO(api): generated client.
// Roles with scope = organisation (doc 27). TODO(api): doc 04 lists no vendor users endpoint yet.
useHead({ title: 'Vendor users' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    email: string | null
    status: string
    last_login_at: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'last_login_at', header: 'Last login at' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/admin/vendors/{id}/users' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Vendor users"
        subject="vendor users"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
