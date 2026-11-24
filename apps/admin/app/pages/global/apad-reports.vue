<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Compliance → APAD reports (doc 23): every collection on a route APAD has not verified, flagged quietly and e-mailed
// to APAD, with the e-mail's status. Nothing about it shows at the counter, on the kiosk or to the passenger.
// Passenger fields are masked unless the user also holds bus.customers.pii.read (doc 27).
// GET /api/admin/apad-reports?workspace=&status=&reason=, POST …/{id}/resend. Permission: bus.apad_reports.read / resend.
useHead({ title: 'APAD reports' })

interface Row extends Record<string, unknown> {
    id: number
    workspace_code: string | null
    collection_ref: string | null
    seat_no: string | null
    passenger_name: string | null
    passenger_phone: string | null
    passenger_id_no: string | null
    route_code: string | null
    destination: string | null
    departs_at: string | null
    operator: string | null
    plate_no: string | null
    reason: 'not_verified' | 'permit_expired' | 'route_unknown'
    status: 'waiting_for_plate' | 'queued' | 'sent' | 'failed'
    attempts: number
    last_error: string | null
    email_to: string | null
    flagged_at: string
    sent_at: string | null
}

const api = useApi()
const toast = useToast()
const { can } = useMe()
const REASONS: Record<Row['reason'], string> = { not_verified: 'Not verified', permit_expired: 'Permit expired', route_unknown: 'Route unknown' }
const STATUSES = [
    { label: 'All statuses', value: undefined },
    { label: 'Waiting for plate', value: 'waiting_for_plate' },
    { label: 'Queued', value: 'queued' },
    { label: 'Sent', value: 'sent' },
    { label: 'Failed', value: 'failed' },
]

const search = ref('')
const status = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/admin/apad-reports', query: () => ({ status: status.value }) })
onMounted(() => list.load())
watch(status, () => list.load())

async function resend(row: Row) {
    try {
        await api.post(`/admin/apad-reports/${row.id}/resend`)
        toast.add({ title: 'Sent to APAD', color: 'success' })
        await list.load(list.pagination.value?.current_page ?? 1)
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'The report could not be sent.', color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'flagged_at', header: 'Flagged', cell: ({ row }) => formatDateTime(row.original.flagged_at) },
    { accessorKey: 'workspace_code', header: 'Terminal', cell: ({ row }) => row.original.workspace_code ?? '—' },
    { accessorKey: 'collection_ref', header: 'Collection', cell: ({ row }) => h('div', [h('div', { class: 'font-medium' }, row.original.collection_ref ?? '—'), h('div', { class: 'text-xs text-gray-500' }, `Seat ${row.original.seat_no ?? '—'}`)]) },
    { accessorKey: 'passenger_name', header: 'Passenger', cell: ({ row }) => h('div', [h('div', row.original.passenger_name ?? '•••'), h('div', { class: 'text-xs text-gray-500' }, [row.original.passenger_phone, row.original.passenger_id_no].filter(Boolean).join(' · '))]) },
    { accessorKey: 'destination', header: 'Route', cell: ({ row }) => h('div', [h('div', row.original.destination ?? 'Not in our system'), h('div', { class: 'text-xs text-gray-500' }, row.original.route_code ?? '')]) },
    { accessorKey: 'departs_at', header: 'Departure', cell: ({ row }) => (row.original.departs_at ? formatDateTime(row.original.departs_at) : '—') },
    { accessorKey: 'operator', header: 'Operator', cell: ({ row }) => row.original.operator ?? '—' },
    { accessorKey: 'plate_no', header: 'Plate', cell: ({ row }) => row.original.plate_no ?? '—' },
    { accessorKey: 'reason', header: 'Why', cell: ({ row }) => REASONS[row.original.reason] },
    { accessorKey: 'status', header: 'E-mail', cell: ({ row }) => h('div', [h(resolveComponent('OpsStatusCell'), { status: row.original.status }), row.original.last_error ? h('div', { class: 'text-xs text-error' }, row.original.last_error) : null]) },
    { accessorKey: 'sent_at', header: 'Sent', cell: ({ row }) => (row.original.sent_at ? formatDateTime(row.original.sent_at) : '—') },
    actionsColumn<Row>((row) => (can('bus.apad_reports.resend') && row.status !== 'sent' ? [{ label: 'Resend now', icon: 'i-bx-send', onSelect: () => resend(row) }] : [])),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="APAD reports"
        subject="reports"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="status" :items="STATUSES" class="w-44" />
        </template>
    </OpsListPage>
</template>
