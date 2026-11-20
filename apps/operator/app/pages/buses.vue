<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Buses: registration, permits, seat layouts (table `vehicles`). Permission: operator.buses.read (doc 27).
// GET /api/v1/operator-portal/buses (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Buses' })

interface Row extends Record<string, unknown> {
    uuid: string
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
const list = useApiList<Row>({ path: '/operator-portal/buses' })
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
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
