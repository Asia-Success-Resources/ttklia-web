<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Booking codes: discount codes (table `promotions`). Permission: bus.codes_booking.read (doc 27).
// GET /api/ops/w/{workspace}/promotions (ttklia-api).
useHead({ title: 'Booking codes' })

interface Row extends Record<string, unknown> {
    id: number
    code: string
    product: string | null
    type: string
    value: number
    max_uses: number | null
    max_uses_per_user: number | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'product', header: 'Product' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'value', header: 'Value' },
    { accessorKey: 'max_uses', header: 'Max uses' },
    { accessorKey: 'max_uses_per_user', header: 'Max uses per user' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/promotions', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Booking codes"
        subject="booking codes"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
