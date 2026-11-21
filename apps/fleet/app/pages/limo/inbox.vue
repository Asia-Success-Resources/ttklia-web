<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Inbox (doc 19, "WhatsApp"): messages from clients' WhatsApp groups (Genting's today). The reader turns booking
// blocks into bookings; staff check each message and make the bookings it holds ("Make booking", with the message
// beside the form), or dismiss it when it is not a booking. One message often holds several bookings.
// GET /fleet/inbox, GET …/{id}, POST …/{id}/convert, …/{id}/dismiss. Permission: fleet.limo_inbox.read / write (doc 27).
useHead({ title: 'Inbox' })

interface Row extends Record<string, unknown> {
    id: number
    sender_name: string | null
    from_address: string
    body: string
    received_at: string
    parsed_status: string
    organisation_id: number | null
    organisation_name: string | null
    bookings_count: number
}

const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.limo_inbox.write') && can('fleet.limo.write'))
const options = useFleetOptions()

const search = ref('')
const status = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/fleet/inbox', workspaceScoped: true, query: () => ({ parsed_status: status.value }) })
onMounted(() => list.load())
watch(status, () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

// Make a booking from the message: the booking form, with the message beside it.
const message = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(emptyBooking)
function makeBooking(row: Row) {
    message.value = row
    options.clients.load()
    options.zones.load()
    options.places.load()
    show({ client_organisation_id: row.organisation_id ?? undefined })
}
async function save() {
    const row = message.value
    if (!row) return
    if (await submit((d) => api.post(`/fleet/inbox/${row.id}/convert`, draftToBody(d)))) {
        toast.add({ title: 'Booking made from the message', description: 'Make another if the message holds more.', color: 'success' })
        await reload()
    }
}
async function dismiss(row: Row) {
    try {
        await api.post(`/fleet/inbox/${row.id}/dismiss`)
        toast.add({ title: 'Message dismissed', color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}
const view = ref<Row | null>(null)

const columns: TableColumn<Row>[] = [
    { accessorKey: 'received_at', header: 'Received' },
    { id: 'from', header: 'From', cell: ({ row }) => row.original.organisation_name ?? row.original.sender_name ?? row.original.from_address },
    {
        accessorKey: 'body',
        header: 'Message',
        cell: ({ row }) => h('button', { type: 'button', class: 'max-w-md truncate text-left hover:underline', onClick: () => (view.value = row.original) }, row.original.body.replace(/\s+/g, ' ').slice(0, 140)),
    },
    { accessorKey: 'bookings_count', header: 'Bookings' },
    { accessorKey: 'parsed_status', header: 'Status' },
    actionsColumn<Row>((row) => [
        { label: 'Read', icon: 'i-bx-message-detail', onSelect: () => (view.value = row) },
        ...(canWrite.value && row.parsed_status !== 'own_message' ? [{ label: 'Make booking', icon: 'i-bx-plus', onSelect: () => makeBooking(row) }] : []),
        ...(canWrite.value && !row.bookings_count && row.parsed_status !== 'ignored' ? [{ label: 'Not a booking', icon: 'i-bx-x', color: 'error' as const, onSelect: () => dismiss(row) }] : []),
    ]),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Inbox"
        subject="WhatsApp messages"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <USelect
                v-model="status"
                :items="[{ label: 'To look at', value: undefined }, { label: 'New', value: 'new' }, { label: 'Needs review', value: 'needs_review' }, { label: 'Read as bookings', value: 'parsed' }, { label: 'Not bookings', value: 'ignored' }]"
                class="w-44"
            />
        </template>
    </OpsListPage>

    <OpsModal
        :open="!!view"
        :title="view?.organisation_name ?? view?.sender_name ?? 'Message'"
        :confirm-label="canWrite ? 'Make booking' : 'Close'"
        @update:open="(v: boolean) => { if (!v) view = null }"
        @confirm="canWrite && view && makeBooking(view)"
    >
        <template v-if="view">
            <p class="mb-2 text-xs text-gray-500">{{ view.from_address }} · {{ formatDateTime(view.received_at) }} · {{ view.bookings_count }} booking(s) made</p>
            <pre class="max-h-[60vh] overflow-y-auto whitespace-pre-wrap font-sans text-sm">{{ view.body }}</pre>
        </template>
    </OpsModal>

    <OpsFormModal v-model:open="form.open" title="Booking from WhatsApp" wide :saving="form.saving" :error="form.error" submit-label="Make Booking" @submit="save">
        <div v-if="message" class="rounded-lg bg-gray-50 p-3 text-xs sm:col-span-2 dark:bg-white/[0.04]">
            <p class="mb-1 font-medium text-gray-500">{{ message.sender_name }} · {{ formatDateTime(message.received_at) }}</p>
            <pre class="max-h-40 overflow-y-auto whitespace-pre-wrap font-sans">{{ message.body }}</pre>
        </div>
        <FleetBookingFields :data="form.data" :field-error="fieldError" :options="options.items" />
    </OpsFormModal>
</template>
