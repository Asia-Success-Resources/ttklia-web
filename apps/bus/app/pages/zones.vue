<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { OpsListFilter } from '~/types/list'

// Zones, as ttklia-v2's admin/bus/zones index (Zone $indexFields): ID, Name, Code, then Show In Kiosk, Actions.
// Search: name, code. Filter: Show In Kiosk. Only the terminal's bus destinations (type bus_destination).
// v2's State and Commission columns are gone: v3 zones have no state, and the commission became the ticket charge
// (ticket_charge_rules, doc 13 and doc 23).
// GET /api/ops/w/{workspace}/zones (ttklia-api). Permission: bus.zones.read (doc 27).
// TODO: v2's zone page (show), Create Zone / edit form and Import/Export come with the detail and form pages.
useHead({ title: 'Zones' })

interface Row extends Record<string, unknown> {
    id: number
    code: string
    name: string
    show_in_kiosk: boolean
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'show_in_kiosk', header: 'Show In Kiosk', cell: ({ row }) => (row.original.show_in_kiosk ? 'Yes' : 'No') },
]

const filters: OpsListFilter[] = [{ key: 'show_in_kiosk', label: 'Show In Kiosk', items: [{ label: 'No', value: '0' }, { label: 'Yes', value: '1' }] }]
const filterValues = ref<Record<string, string | undefined>>({})

const search = ref('')
const list = useApiList<Row>({ search, path: '/zones', workspaceScoped: true, query: () => ({ type: 'bus_destination', ...chosen(filterValues.value) }) })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        v-model:filter-values="filterValues"
        title="Zones"
        subject="zone"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :filters="filters"
        @filter="list.load()"
        @page="list.load"
    />
</template>
