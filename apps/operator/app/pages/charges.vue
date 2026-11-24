<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Charges: ticket, entry, facility (table `ticket_charge_rules`). Permission: operator.charges.read (doc 27).
// TODO(pending: C3) see doc 30.
// TODO(pending: F5) see doc 30.
// GET /api/operator-portal/charges (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Charges' })

interface Row extends Record<string, unknown> {
    uuid: string
    channel_group: string
    price_from_rm: number
    price_to_rm: number | null
    fee_rm: number | null
    percent_bp: number | null
    max_rm: number | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'channel_group', header: 'Channel group' },
    { accessorKey: 'price_from_rm', header: 'Price from (RM)', cell: ({ row }) => formatRm(row.original.price_from_rm as number | null) },
    { accessorKey: 'price_to_rm', header: 'Price to (RM)', cell: ({ row }) => formatRm(row.original.price_to_rm as number | null) },
    { accessorKey: 'fee_rm', header: 'Fee (RM)', cell: ({ row }) => formatRm(row.original.fee_rm as number | null) },
    { accessorKey: 'percent_bp', header: 'Percent bp' },
    { accessorKey: 'max_rm', header: 'Max (RM)', cell: ({ row }) => formatRm(row.original.max_rm as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/operator-portal/charges' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Charges"
        subject="charges"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        note="Waiting on: C3, F5 (doc 30)."
        @page="list.load"
    />
</template>
