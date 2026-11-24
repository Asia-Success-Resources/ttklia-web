<!-- TODO(removed-from-docs): Sitemap 4 moved this page to the admin app (apps/admin/app/pages/pricing/fares.vue). Kept, not deleted; remove when agreed. -->
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Fares: list (table `fare_rules`). Permission: ride.pricing_fares.read (doc 27).
// GET /api/ops/w/{workspace}/pricing/fares (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Fares' })

interface Row extends Record<string, unknown> {
    uuid: string
    product: string
    vehicle_class: string | null
    ticket_type: string | null
    flat_rm: number | null
    base_rm: number | null
    per_km_rm: number | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'product', header: 'Product' },
    { accessorKey: 'vehicle_class', header: 'Vehicle class' },
    { accessorKey: 'ticket_type', header: 'Ticket type' },
    { accessorKey: 'flat_rm', header: 'Flat (RM)', cell: ({ row }) => formatRm(row.original.flat_rm as number | null) },
    { accessorKey: 'base_rm', header: 'Base (RM)', cell: ({ row }) => formatRm(row.original.base_rm as number | null) },
    { accessorKey: 'per_km_rm', header: 'Per km (RM)', cell: ({ row }) => formatRm(row.original.per_km_rm as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/pricing/fares', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Fares"
        subject="fares"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
