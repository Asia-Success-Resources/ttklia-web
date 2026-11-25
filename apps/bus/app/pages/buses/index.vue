<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { OpsListFilter } from '~/types/list'

// Buses, as ttklia-v2's admin/bus/buses index (Bus $indexFields): Plate Number, Company, Type (bus type, the seat
// layout), Express Type, Created At. Search: plate number. Filter: Company, Express Type.
// GET /api/ops/w/{workspace}/vehicles (ttklia-api, bus terminal branch). Permission: bus.buses.read (doc 27).
// TODO: v2's bus page (show), Create Bus / edit form and Export come with the detail and form pages.
useHead({ title: 'Buses' })

interface Row extends Record<string, unknown> {
    id: number
    plate_no: string
    company: string | null
    bus_type: string | null
    bus_service: string | null
    created_at: string
}

// v2 Bus::EXPRESS_TYPE_ARRAY on v3's `bus_service`.
const expressLabels: Record<string, string> = { express: 'Express', other: 'Non-Express' }

const columns: TableColumn<Row>[] = [
    { accessorKey: 'plate_no', header: 'Plate Number' },
    { accessorKey: 'company', header: 'Company', cell: ({ row }) => row.original.company ?? '-' },
    { accessorKey: 'bus_type', header: 'Type', cell: ({ row }) => row.original.bus_type ?? '-' },
    { accessorKey: 'bus_service', header: 'Express Type', cell: ({ row }) => (row.original.bus_service ? expressLabels[row.original.bus_service] ?? row.original.bus_service : '-') },
    { accessorKey: 'created_at', header: 'Created At' },
]

const options = useBusOptions()
const filters = computed<OpsListFilter[]>(() => [
    { key: 'company_id', label: 'Company', items: options.operators.value },
    { key: 'bus_service', label: 'Express Type', items: Object.entries(expressLabels).map(([value, label]) => ({ label, value })) },
])
const filterValues = ref<Record<string, string | undefined>>({})

const search = ref('')
const list = useApiList<Row>({ search, path: '/vehicles', workspaceScoped: true, query: () => chosen(filterValues.value) })
onMounted(() => {
    list.load()
    options.load('operators')
})
</script>

<template>
    <OpsListPage
        v-model:search="search"
        v-model:filter-values="filterValues"
        title="Buses"
        subject="bus"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :filters="filters"
        @filter="list.load()"
        @page="list.load"
    />
</template>
