<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Registrations: buses operators asked to add, waiting for approval (table `vehicle_requests`). Permission: bus.buses_registrations.read (doc 27).
// GET /api/ops/w/{workspace}/vehicles/registrations (ttklia-api).
useHead({ title: 'Registrations' })

interface Row extends Record<string, unknown> {
    plate_normalised: string
    bus_service: string | null
    organisation_name: string | null
    status: string
    reject_reason: string | null
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'plate_normalised', header: 'Plate' },
    { accessorKey: 'organisation_name', header: 'Operator' },
    { accessorKey: 'bus_service', header: 'Bus service' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'reject_reason', header: 'Reject reason' },
    { accessorKey: 'created_at', header: 'Requested at' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/vehicles/registrations', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Registrations"
        subject="registrations"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    />
</template>
