<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { OpsListFilter } from '~/types/list'

// Bookings, as ttklia-v2's admin/bus/bookings index (Booking $indexFields and bookings/index-search):
// Code, Zone, Operator, Sold By, Kiosk, Date, Time, Seat, No of Tickets, Ticket Type, Grand Total, Collection,
// Sold At, Status. The search row: Search, Company, Zone, Kiosk, System Provider, Payment Method, Type, Ticket Type,
// Collection, Status, Date, Time, then Search and Reset.
// GET /api/ops/w/{workspace}/bus/bookings (ttklia-api). Permission: bus.bookings.read (doc 27).
// The code and the Actions column open the booking page (bookings/[uuid].vue).
// TODO(api): v2's Payment Status filter and Export come in a later round.
useHead({ title: 'Bookings' })

interface Row extends Record<string, unknown> {
    uuid: string
    code: string
    reference: string | null
    zone: string | null
    operator: string | null
    sold_by: string | null
    kiosk: string | null
    channel: string
    departs_at: string | null
    seats: string[]
    total_pax: number
    ticket_types: string[]
    total_sen: number
    is_collection: boolean
    created_at: string
    status: string
}

const options = useBusOptions()
const { resolveTo } = useOpsShell()


const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => h(resolveComponent('NuxtLink'), { to: resolveTo(`/bookings/${row.original.uuid}`), class: 'font-medium text-primary hover:underline' }, () => row.original.code) },
    { accessorKey: 'zone', header: 'Zone', cell: ({ row }) => row.original.zone ?? '-' },
    { accessorKey: 'operator', header: 'Operator', cell: ({ row }) => row.original.operator ?? '-' },
    { accessorKey: 'sold_by', header: 'Sold By', cell: ({ row }) => row.original.sold_by ?? '-' },
    { accessorKey: 'kiosk', header: 'Kiosk', cell: ({ row }) => row.original.kiosk ?? '-' },
    { id: 'date', header: 'Date', cell: ({ row }) => klTime(row.original.departs_at, { day: '2-digit', month: '2-digit', year: 'numeric' }) },
    { id: 'time', header: 'Time', cell: ({ row }) => klTime(row.original.departs_at, { hour: '2-digit', minute: '2-digit' }) },
    { accessorKey: 'seats', header: 'Seat', cell: ({ row }) => row.original.seats.join(', ') || '-' },
    { accessorKey: 'total_pax', header: 'No of Tickets' },
    { accessorKey: 'ticket_types', header: 'Ticket Type', cell: ({ row }) => row.original.ticket_types.join(', ') || '-' },
    { accessorKey: 'total_sen', header: 'Grand Total', cell: ({ row }) => formatSen(row.original.total_sen) },
    { accessorKey: 'is_collection', header: 'Collection', cell: ({ row }) => (row.original.is_collection ? 'Yes' : 'No') },
    { accessorKey: 'created_at', header: 'Sold At', cell: ({ row }) => formatDateTime(row.original.created_at) },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => h(resolveComponent('UBadge'), { label: orderStatusLabels[row.original.status] ?? row.original.status, variant: 'soft', color: orderStatusColor(row.original.status) }),
    },
]

const filters = computed<OpsListFilter[]>(() => [
    { key: 'company_id', label: 'Company', items: options.operators.value },
    { key: 'zone_id', label: 'Zone', items: options.zones.value },
    { key: 'kiosk_id', label: 'Kiosk', items: options.kiosks.value },
    { key: 'system_provider_id', label: 'System Provider', items: options.systemProviders.value },
    {
        key: 'payment_method',
        label: 'Payment Method',
        items: [
            { label: 'Cash', value: 'cash' }, { label: 'Card', value: 'card' }, { label: 'E-Wallet', value: 'wallet' },
            { label: 'Points', value: 'points' }, { label: 'Online', value: 'fiuu' }, { label: 'GHL', value: 'ghl' },
        ],
    },
    { key: 'type', label: 'Type', items: [{ label: 'Counter', value: 'counter' }, { label: 'Kiosk', value: 'kiosk' }, { label: 'Online', value: 'online' }] },
    {
        key: 'ticket_type',
        label: 'Ticket Type',
        type: 'multi',
        items: [{ label: 'Adult', value: 'adult' }, { label: 'Child', value: 'child' }, { label: 'Senior', value: 'senior' }, { label: 'OKU', value: 'oku' }],
    },
    { key: 'is_collection', label: 'Collection', items: [{ label: 'No', value: '0' }, { label: 'Yes', value: '1' }] },
    { key: 'status', label: 'Status', items: Object.entries(orderStatusLabels).map(([value, label]) => ({ label, value })) },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'time', label: 'Time', type: 'time' },
])
const filterValues = ref<Record<string, string | undefined>>({})

const search = ref('')
const list = useApiList<Row>({ path: '/bus/bookings', workspaceScoped: true, query: () => ({ q: search.value || undefined, ...chosen(filterValues.value) }) })
onMounted(() => {
    list.load()
    options.load('operators', 'zones', 'kiosks', 'systemProviders')
})
</script>

<template>
    <OpsListPage
        title="Bookings"
        subject="booking"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        :show-to="(row) => resolveTo(`/bookings/${row.uuid}`)"
        @page="list.load"
    >
        <template #search>
            <OpsFilterBar v-model:search="search" v-model:values="filterValues" :filters="filters" @apply="list.load()" />
        </template>
    </OpsListPage>
</template>
