<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Zones (doc 19, "Pricing"): the fleet's fare zones and service areas, with their toll and version. Limo fares are
// priced from zone to zone and vehicle class; shapes, H3 cells and the fares themselves are edited under Pricing in the
// admin app. GET /zones. Permission: fleet.zones.read (doc 27).
useHead({ title: 'Zones' })

interface Row extends Record<string, unknown> {
    id: number
    code: string
    name: string
    type: string
    location_type: string | null
    toll_rm: number
    h3_resolution: number
    version: number
}

const search = ref('')
const type = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/zones', workspaceScoped: true, query: () => ({ type: type.value }) })
onMounted(() => list.load())
watch(type, () => list.load())

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => statusLabel(row.original.type) },
    { accessorKey: 'location_type', header: 'Local or outstation', cell: ({ row }) => statusLabel(row.original.location_type ?? '-') },
    { accessorKey: 'toll_rm', header: 'Toll', cell: ({ row }) => (row.original.toll_rm ? formatRm(row.original.toll_rm) : '—') },
    { accessorKey: 'h3_resolution', header: 'H3 resolution' },
    { accessorKey: 'version', header: 'Version' },
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Zones"
        subject="zones"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        note="Shapes and limo fares are set under Pricing in the admin app."
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="type" :items="[{ label: 'All types', value: undefined }, { label: 'Service area', value: 'service_area' }, { label: 'Taxi fare', value: 'taxi_fare' }, { label: 'Teeko fare', value: 'ride_fare' }]" class="w-40" />
        </template>
    </OpsListPage>
</template>
