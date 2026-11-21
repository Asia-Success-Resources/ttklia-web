<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Pickup queue screens: the e-hailing queue displays and the zones each shows (table `display_screens` with
// layout `ehailing_queue` and `queue_zones`; doc 33). Permission: ride.pickup_queue_screens.read (doc 27).
// GET /api/ops/w/{workspace}/displays?layout=ehailing_queue (ttklia-api). TODO(api): the endpoint is a stub.
useHead({ title: 'Queue screens' })

interface Row extends Record<string, unknown> {
    id: number
    code: string
    queue_zones: string[] | null
    languages: string
    last_seen_at: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    {
        accessorKey: 'queue_zones',
        header: 'Zones shown',
        cell: ({ row }) => row.original.queue_zones?.join(', ') || 'All zones at the location',
    },
    { accessorKey: 'languages', header: 'Languages' },
    { accessorKey: 'last_seen_at', header: 'Last seen at' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/displays', workspaceScoped: true, query: { layout: 'ehailing_queue' } })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Queue screens"
        subject="queue screens"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    />
</template>
