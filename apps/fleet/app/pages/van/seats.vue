<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Seats: public seat bookings (table `fleet_bookings`). Permission: fleet.van_seats.read (doc 27).
// TODO(pending: P9) see doc 30.
// GET /api/v1/ops/w/{workspace}/fleet/bookings (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Seats' })

interface Row extends Record<string, unknown> {
    uuid: string
    reference: string
    service: string
    source: string
    client_reference: string | null
    guest_name: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'reference', header: 'Reference' },
    { accessorKey: 'service', header: 'Service' },
    { accessorKey: 'source', header: 'Source' },
    { accessorKey: 'client_reference', header: 'Client reference' },
    { accessorKey: 'guest_name', header: 'Guest name' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/fleet/bookings', workspaceScoped: true, query: { service: 'van_seat' } })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Seats"
        subject="seats"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        note="Waiting on: P9 (doc 30)."
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
