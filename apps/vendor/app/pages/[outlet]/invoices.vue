<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Invoices: TTKLIA's e-invoices to the vendor (table `einvoices`). Permission: vendor.statements.read (doc 32).
// GET /api/v1/vendor-portal/invoices (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
// API: GET /vendor-portal/invoices (doc 32). TODO(api): generated client.
useHead({ title: 'Invoices' })

interface Row extends Record<string, unknown> {
    uuid: string
    document_type: string
    total_sen: number
    sst_sen: number
    status: string
    validated_at: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'document_type', header: 'Document type' },
    { accessorKey: 'total_sen', header: 'Total (RM)', cell: ({ row }) => formatSen(row.original.total_sen as number | null) },
    { accessorKey: 'sst_sen', header: 'Sst (RM)', cell: ({ row }) => formatSen(row.original.sst_sen as number | null) },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'validated_at', header: 'Validated at' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ search, path: '/vendor-portal/invoices' })
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
        :pagination="list.pagination.value"
        @page="list.load"
    />
</template>
