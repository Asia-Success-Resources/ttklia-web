<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// System: API keys, IP allow-list, call log (table `operator_api_clients`). Permission: operator.system.read (doc 27).
// GET /api/v1/operator-portal/system/api-clients (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'System' })

interface Row extends Record<string, unknown> {
    uuid: string
    kind: string
    scopes: unknown
    last_used_at: string | null
    revoked_at: string | null
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'kind', header: 'Kind' },
    { accessorKey: 'scopes', header: 'Scopes' },
    { accessorKey: 'last_used_at', header: 'Last used at' },
    { accessorKey: 'revoked_at', header: 'Revoked at' },
    { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/operator-portal/system/api-clients' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="System"
        subject="system"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
