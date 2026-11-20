<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Charges: ticket, entry, facility (table `ticket_charge_rules`). Permission: operator.charges.read (doc 27).
// TODO(pending: C3) see doc 30.
// TODO(pending: F5) see doc 30.
// GET /api/v1/operator-portal/charges (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Charges' })

interface Row extends Record<string, unknown> {
    uuid: string
    channel_group: string
    price_from_sen: number
    price_to_sen: number | null
    fee_sen: number | null
    percent_bp: number | null
    max_sen: number | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'channel_group', header: 'Channel group' },
    { accessorKey: 'price_from_sen', header: 'Price from (RM)', cell: ({ row }) => formatSen(row.original.price_from_sen as number | null) },
    { accessorKey: 'price_to_sen', header: 'Price to (RM)', cell: ({ row }) => formatSen(row.original.price_to_sen as number | null) },
    { accessorKey: 'fee_sen', header: 'Fee (RM)', cell: ({ row }) => formatSen(row.original.fee_sen as number | null) },
    { accessorKey: 'percent_bp', header: 'Percent bp' },
    { accessorKey: 'max_sen', header: 'Max (RM)', cell: ({ row }) => formatSen(row.original.max_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ path: '/operator-portal/charges' })
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
        :has-more="list.nextCursor.value !== null"
        note="Waiting on: C3, F5 (doc 30)."
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
