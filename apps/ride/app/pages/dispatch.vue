<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Dispatch (table `ride_offers`, doc 07): each offer sent to a driver, newest first: the request (rider, pickup, car),
// the driver, the round and ring, ETA, when it went out and expires, and the answer. "Waiting only" shows the offers
// still open. GET /ops/w/{workspace}/ride/dispatch. Permission: ride.dispatch.read (doc 27).
useHead({ title: 'Dispatch' })

interface Row extends Record<string, unknown> {
    id: number
    request_uuid: string
    request_status: string
    vehicle_class: string
    rider_name: string | null
    pickup: string
    driver_name: string | null
    driver_no: string | null
    round: number
    ring_k: number
    eta_seconds: number | null
    offered_at: string
    expires_at: string
    response: string
    responded_at: string | null
}

const search = ref('')
const response = ref<string | undefined>(undefined)
const live = ref(false)
const date = ref('')
const list = useApiList<Row>({
    search,
    path: '/ride/dispatch',
    workspaceScoped: true,
    query: () => ({ response: response.value, live: live.value ? 1 : undefined, date: date.value || undefined }),
})
onMounted(() => list.load())
watch([response, live, date], () => list.load())
// Waiting offers last seconds: refresh every 10 s while that view is open.
let timer: ReturnType<typeof setInterval> | undefined
watch(live, (on) => {
    clearInterval(timer)
    if (on) timer = setInterval(() => list.load(), 10_000)
})
onBeforeUnmount(() => clearInterval(timer))

const columns: TableColumn<Row>[] = [
    { accessorKey: 'offered_at', header: 'Sent' },
    { id: 'driver', header: 'Driver', cell: ({ row }) => row.original.driver_name ?? row.original.driver_no ?? '—' },
    { id: 'request', header: 'Request', cell: ({ row }) => h(resolveComponent('NuxtLink'), { to: `/requests/${row.original.request_uuid}`, class: 'hover:underline' }, () => [h('div', { class: 'font-medium' }, row.original.rider_name ?? 'Rider'), h('div', { class: 'max-w-64 truncate text-xs text-gray-500' }, row.original.pickup)]) },
    { accessorKey: 'vehicle_class', header: 'Car', cell: ({ row }) => carLabel(row.original.vehicle_class) },
    { accessorKey: 'round', header: 'Round' },
    { accessorKey: 'ring_k', header: 'Ring' },
    { accessorKey: 'eta_seconds', header: 'ETA', cell: ({ row }) => minutes(row.original.eta_seconds) },
    { accessorKey: 'expires_at', header: 'Expires' },
    { accessorKey: 'response', header: 'Answer', cell: ({ row }) => h(resolveComponent('OpsStatusCell'), { status: row.original.response }) },
    { accessorKey: 'request_status', header: 'Request status' },
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Dispatch"
        subject="offers"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <UInput v-model="date" type="date" class="w-40" />
            <USelect v-model="response" :items="[{ label: 'All answers', value: undefined }, { label: 'Waiting', value: 'pending' }, { label: 'Accepted', value: 'accepted' }, { label: 'Declined', value: 'declined' }, { label: 'Timed out', value: 'timeout' }]" class="w-36" />
            <UCheckbox v-model="live" label="Waiting only (live)" />
        </template>
    </OpsListPage>
</template>
