<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Ticket types: list (table `ticket_charge_rules`). Permission: bus.ticket_types.read (doc 27).
// TODO(pending: C3) see doc 30.
// TODO(pending: F5) see doc 30.
// GET /api/ops/w/{workspace}/ticket-charge-rules (ttklia-api).
useHead({ title: 'Ticket types' })

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
const list = useApiList<Row>({ search, path: '/ticket-charge-rules', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Ticket types"
        subject="ticket types"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        note="Waiting on: C3, F5 (doc 30)."
        @page="list.load"
    />
</template>
