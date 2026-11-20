<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Stock movements: every change, never edited (table `stock_movements`). Permission: vendor.stock.read (doc 32).
// API: GET /vendor-portal/o/{outlet}/stock-movements (doc 04, doc 32). TODO(api): generated client.
useHead({ title: 'Stock movements' })

interface Row extends Record<string, unknown> {
    uuid: string
    delta: number
    reason: string
    note: string | null
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'delta', header: 'Delta' },
    { accessorKey: 'reason', header: 'Reason' },
    { accessorKey: 'note', header: 'Note' },
    { accessorKey: 'created_at', header: 'Created at' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ path: vendorPath('stock-movements') })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Stock movements"
        subject="stock movements"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
