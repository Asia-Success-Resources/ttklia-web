<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Invoices: e-invoices (table `einvoices`). Permission: operator.invoices.read (doc 27).
// TODO(pending: F6) see doc 30.
// TODO(pending: G4) see doc 30.
// GET /api/v1/operator-portal/invoices (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Invoices' })

interface Row extends Record<string, unknown> {
    uuid: string
    source_type: string
    document_type: string
    buyer_tin: string | null
    total_sen: number
    sst_sen: number
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'source_type', header: 'Source type' },
    { accessorKey: 'document_type', header: 'Document type' },
    { accessorKey: 'buyer_tin', header: 'Buyer tin' },
    { accessorKey: 'total_sen', header: 'Total (RM)', cell: ({ row }) => formatSen(row.original.total_sen as number | null) },
    { accessorKey: 'sst_sen', header: 'Sst (RM)', cell: ({ row }) => formatSen(row.original.sst_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ path: '/operator-portal/invoices' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Invoices"
        subject="invoices"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        note="Waiting on: F6, G4 (doc 30)."
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
