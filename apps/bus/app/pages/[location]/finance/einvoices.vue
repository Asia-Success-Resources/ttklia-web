<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Einvoices: list (table `einvoices`). Permission: bus.finance_einvoices.read (doc 27).
// TODO(pending: F6) see doc 30.
// TODO(pending: G4) see doc 30.
// GET /api/v1/ops/w/{workspace}/finance/einvoices (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'E-invoices' })

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
const list = useApiList<Row>({ path: '/finance/einvoices', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Einvoices"
        subject="einvoices"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        note="Waiting on: F6, G4 (doc 30)."
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
