<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Buses: registered buses, permits, seat layout (table `vehicles`). Permission: bus.buses.read (doc 27).
// GET /api/ops/w/{workspace}/vehicles (ttklia-api).
useHead({ title: 'Buses' })

interface Row extends Record<string, unknown> {
    id: number
    plate_no: string
    type: string
    vehicle_class: string
    make: string | null
    model: string | null
    year: number | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'plate_no', header: 'Plate no' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'vehicle_class', header: 'Vehicle class' },
    { accessorKey: 'make', header: 'Make' },
    { accessorKey: 'model', header: 'Model' },
    { accessorKey: 'year', header: 'Year' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/vehicles', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Buses"
        subject="buses"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
