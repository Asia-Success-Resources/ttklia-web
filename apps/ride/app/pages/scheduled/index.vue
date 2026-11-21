<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Scheduled rides: by day, with status filters (table `ride_requests` with `scheduled_for`; doc 35, Sitemap 4).
// Permission: ride.scheduled.read. GET /api/ops/w/{workspace}/rides/scheduled (ttklia-api). TODO(api): stub.
// TODO(doc 35): map and counts for the next hours.
useHead({ title: 'Scheduled rides' })

interface Row extends Record<string, unknown> {
    uuid: string
    scheduled_for: string
    matching_starts_at: string | null
    vehicle_class: string
    quoted_fare_sen: number
    channel: string
    status: string
}

const statuses = [
    { label: 'All', value: '' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Matching', value: 'searching' },
    { label: 'No driver', value: 'no_driver' },
    { label: 'Cancelled', value: 'cancelled' },
]
const day = ref(new Date().toISOString().slice(0, 10))
const status = ref('')

const columns: TableColumn<Row>[] = [
    { accessorKey: 'scheduled_for', header: 'Pickup at' },
    { accessorKey: 'matching_starts_at', header: 'Matching from' },
    { accessorKey: 'vehicle_class', header: 'Car' },
    { accessorKey: 'quoted_fare_sen', header: 'Fare', cell: ({ row }) => formatSen(row.original.quoted_fare_sen) },
    { accessorKey: 'channel', header: 'Booked by' },
    { accessorKey: 'status', header: 'Status' },
    {
        id: 'open',
        header: '',
        cell: ({ row }) => h(resolveComponent('UButton'), { label: 'Open', size: 'xs', variant: 'outline', color: 'neutral', to: `/scheduled/${row.original.uuid}` }),
    },
]

const search = ref('')
const query = reactive<Record<string, string>>({ date: day.value })
const list = useApiList<Row>({ search, path: '/rides/scheduled', workspaceScoped: true, query })
watch([day, status], () => {
    query.date = day.value
    if (status.value) query.status = status.value
    else delete query.status
    list.load()
})
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Scheduled rides"
        subject="scheduled rides"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        create-to="/scheduled/new"
        @page="list.load"
    >
        <template #search>
            <div class="flex flex-wrap gap-3">
                <UInput v-model="day" type="date" />
                <USelect v-model="status" :items="statuses" class="w-44" />
                <UInput v-model="search" icon="i-bx-search" placeholder="Search…" class="min-w-48 flex-1" />
            </div>
        </template>
    </OpsListPage>
</template>
