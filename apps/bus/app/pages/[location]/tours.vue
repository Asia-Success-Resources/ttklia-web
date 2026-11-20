<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Tours: list (table `catalog_items`). Permission: bus.tours.read (doc 27).
// GET /api/v1/ops/w/{workspace}/catalog-items (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Tours' })

interface Row extends Record<string, unknown> {
    uuid: string
    type: string
    sku: string
    name: string
    price_sen: number
    sst_rate_bp: number
    is_active: boolean
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'sku', header: 'Sku' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'price_sen', header: 'Price (RM)', cell: ({ row }) => formatSen(row.original.price_sen as number | null) },
    { accessorKey: 'sst_rate_bp', header: 'Sst rate bp' },
    { accessorKey: 'is_active', header: 'Is active' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/catalog-items', workspaceScoped: true, query: { type: 'tour' } })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Tours"
        subject="tours"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
