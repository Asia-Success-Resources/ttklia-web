<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Client changes (doc 19): changes clients asked for after booking, mostly by WhatsApp, waiting for staff. Each shows
// what changes (field: from → to); Accept applies it to the booking, Reject asks why. A booking already done or
// closed cannot change. `?booking=` shows one booking's changes. GET /fleet/booking-changes, POST …/{id}/accept,
// …/{id}/reject. Permission: fleet.limo_changes.read / write (doc 27).
useHead({ title: 'Client changes' })

interface Row extends Record<string, unknown> {
    id: number
    booking_uuid: string
    reference: string
    pickup_at: string
    guest_name: string | null
    booking_status: string
    status: string
    created_at: string
    reviewed_by_name: string | null
    rejected_reason: string | null
    diff: { field: string; from: unknown; to: unknown }[]
}

const route = useRoute()
const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.limo_changes.write'))

const search = ref('')
const status = ref<string>('pending')
const booking = computed(() => (typeof route.query.booking === 'string' ? route.query.booking : undefined))
const bookingId = ref<number | undefined>(undefined)
const list = useApiList<Row>({
    search,
    path: '/fleet/booking-changes',
    workspaceScoped: true,
    query: () => ({ status: status.value, fleet_booking_id: bookingId.value }),
})
onMounted(async () => {
    if (booking.value) {
        try {
            bookingId.value = (await api.get<{ data: { id?: number } }>(`/fleet/bookings/${booking.value}`)).data.id
        } catch {
            bookingId.value = undefined
        }
    }
    list.load()
})
watch(status, () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const show = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v))
async function accept(row: Row) {
    try {
        const res = await api.post<{ data: { applied: string[] } }>(`/fleet/booking-changes/${row.id}/accept`)
        toast.add({ title: `Change applied to ${row.reference}`, description: res.data.applied.length ? `Changed: ${res.data.applied.join(', ').replace(/_/g, ' ')}` : 'Nothing on the booking differed; a driver or plate in the change is assigned on the booking.', color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}
const reason = useReasonAction()
function reject(row: Row) {
    reason.ask({
        title: `Reject change to ${row.reference}`,
        submitLabel: 'Reject',
        run: async (text) => {
            await api.post(`/fleet/booking-changes/${row.id}/reject`, { reason: text })
            toast.add({ title: 'Change rejected', color: 'success' })
            await reload()
        },
    })
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'created_at', header: 'Asked' },
    {
        accessorKey: 'reference',
        header: 'Booking',
        cell: ({ row }) => h(resolveComponent('NuxtLink'), { to: `/limo/${row.original.booking_uuid}`, class: 'font-medium text-primary hover:underline' }, () => row.original.reference),
    },
    { accessorKey: 'pickup_at', header: 'Pickup' },
    { accessorKey: 'guest_name', header: 'Guest' },
    {
        id: 'diff',
        header: 'Change',
        cell: ({ row }) => h('div', { class: 'space-y-0.5 text-xs' }, row.original.diff.map((d) =>
            h('div', [h('span', { class: 'text-gray-500' }, `${d.field.replace(/_/g, ' ')}: `), h('span', { class: 'text-gray-400 line-through' }, show(d.from)), ` → ${show(d.to)}`]))),
    },
    { accessorKey: 'booking_status', header: 'Booking status' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) =>
        canWrite.value && row.status === 'pending'
            ? [
                  { label: 'Accept', icon: 'i-bx-check', onSelect: () => accept(row) },
                  { label: 'Reject', icon: 'i-bx-x', color: 'error' as const, onSelect: () => reject(row) },
              ]
            : [],
    ),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Client changes"
        subject="client changes"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        :note="booking ? 'Showing one booking\'s changes.' : undefined"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="status" :items="[{ label: 'Waiting', value: 'pending' }, { label: 'Accepted', value: 'accepted' }, { label: 'Rejected', value: 'rejected' }]" class="w-36" />
            <UButton v-if="booking" label="All bookings" color="neutral" variant="outline" to="/limo/changes" />
        </template>
    </OpsListPage>
    <OpsReasonModal :action="reason" />
</template>
