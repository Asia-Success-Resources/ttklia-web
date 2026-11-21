<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Transfers: move passengers (no table). Permission: operator.transfers.read (doc 27).
// TODO(pending: G2) see doc 30.
// GET /api/operator-portal/transfers (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Transfers' })

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
const list = useApiList<Row>({ search, path: '/operator-portal/transfers' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Transfers"
        subject="transfers"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        note="Waiting on: G2 (doc 30)."
        @page="list.load"
    />
</template>
