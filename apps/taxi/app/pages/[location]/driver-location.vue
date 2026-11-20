<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Driver location: list (table `drivers`). Permission: taxi.driver_location.read (doc 27).
// GET /api/v1/ops/w/{workspace}/taxi/driver-locations (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Driver location' })

interface Row extends Record<string, unknown> {
    uuid: string
    tier: string
    licence_class: string
    languages: string | null
    status: string
    approved_at: string | null
    approved_by: number | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'tier', header: 'Tier' },
    { accessorKey: 'licence_class', header: 'Licence class' },
    { accessorKey: 'languages', header: 'Languages' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'approved_at', header: 'Approved at' },
    { accessorKey: 'approved_by', header: 'Approved by' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/taxi/driver-locations', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Driver location"
        subject="driver location"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
