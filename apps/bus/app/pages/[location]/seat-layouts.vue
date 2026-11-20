<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Seat layouts: seat plans (replaces bus types) (table `seat_layouts`). Permission: bus.seat_layouts.read (doc 27).
// GET /api/v1/ops/w/{workspace}/seat-layouts (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Seat layouts' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    decks: number
    grid: unknown
    cells: unknown
    seat_count: number
    version: number
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'decks', header: 'Decks' },
    { accessorKey: 'grid', header: 'Grid' },
    { accessorKey: 'cells', header: 'Cells' },
    { accessorKey: 'seat_count', header: 'Seat count' },
    { accessorKey: 'version', header: 'Version' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/seat-layouts', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Seat layouts"
        subject="seat layouts"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
