<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Gates: live lanes (table `gates`). Permission: bus.gates.read (doc 27).
// GET /api/ops/w/{workspace}/gates (ttklia-api).
useHead({ title: 'Gates' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    direction: string
    purpose: string
    identifies_by: string
    mode: string
    entry_fare_sen: number
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'direction', header: 'Direction' },
    { accessorKey: 'purpose', header: 'Purpose' },
    { accessorKey: 'identifies_by', header: 'Identifies by' },
    { accessorKey: 'mode', header: 'Mode' },
    { accessorKey: 'entry_fare_sen', header: 'Entry fare (RM)', cell: ({ row }) => formatSen(row.original.entry_fare_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/gates', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Gates"
        subject="gates"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
