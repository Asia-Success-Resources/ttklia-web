<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Claims: driver claims (no table). Permission: taxi.claims.read (doc 27).
// TODO(pending: doc 09 gap) no table for this screen yet in tools/schema.py (sitemap "*").
// GET /api/ops/w/{workspace}/taxi/claims (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Claims' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    status: string
    updated_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'updated_at', header: 'Updated at' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/taxi/claims', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Claims"
        subject="claims"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        note="No table for this screen yet in the data model (doc 09, gap list)."
        @page="list.load"
    />
</template>
