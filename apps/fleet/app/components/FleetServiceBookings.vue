<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Van seats and self-drive rentals (`fleet_bookings` with service van_seat or rental, doc 19): a plain list of the
// bookings, newest pickup first, with their guest, times, places, status and total. Selling them comes with the public
// web and apps (doc 30 P9); staff see and open them here. GET /fleet/bookings?service=…
const props = defineProps<{ title: string; service: 'van_seat' | 'rental'; subject: string }>()

interface Row extends Record<string, unknown> {
    uuid: string
    reference: string
    pickup_at: string
    return_at: string | null
    guest_name: string | null
    guest_phone: string | null
    from_text: string
    to_text: string | null
    pax_count: number
    vehicle_class: string
    status: string
    total_sen: number
}

const search = ref('')
const status = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/fleet/bookings', workspaceScoped: true, query: () => ({ service: props.service, status: status.value }) })
onMounted(() => list.load())
watch(status, () => list.load())

const columns: TableColumn<Row>[] = [
    { accessorKey: 'reference', header: 'Booking' },
    { accessorKey: 'pickup_at', header: props.service === 'rental' ? 'From' : 'Pick up' },
    ...(props.service === 'rental' ? [{ accessorKey: 'return_at', header: 'Until' } as TableColumn<Row>] : []),
    { id: 'guest', header: 'Guest', cell: ({ row }) => [row.original.guest_name, row.original.guest_phone].filter(Boolean).join(' · ') || '—' },
    { id: 'where', header: 'Where', cell: ({ row }) => [row.original.from_text, row.original.to_text].filter(Boolean).join(' → ') || '—' },
    { accessorKey: props.service === 'rental' ? 'vehicle_class' : 'pax_count', header: props.service === 'rental' ? 'Vehicle' : 'Seats' },
    { accessorKey: 'total_sen', header: 'Total', cell: ({ row }) => formatSen(row.original.total_sen) },
    { accessorKey: 'status', header: 'Status' },
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        :title="props.title"
        :subject="props.subject"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        note="These are sold on the public web and apps; selling them there is still to come (doc 30 P9)."
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="status" :items="[{ label: 'All statuses', value: undefined }, { label: 'Confirmed', value: 'confirmed' }, { label: 'Completed', value: 'completed' }, { label: 'Cancelled', value: 'cancelled' }]" class="w-40" />
        </template>
    </OpsListPage>
</template>
