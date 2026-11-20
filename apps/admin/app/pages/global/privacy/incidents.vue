<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Incidents: breaches, 72 h (table `privacy_incidents`). Permission: global.privacy_incidents.read (doc 27).
// GET /api/v1/admin/privacy/incidents (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Incidents' })

interface Row extends Record<string, unknown> {
    uuid: string
    discovered_at: string
    occurred_at: string | null
    summary: string
    data_classes: unknown
    people_affected: number | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'discovered_at', header: 'Discovered at' },
    { accessorKey: 'occurred_at', header: 'Occurred at' },
    { accessorKey: 'summary', header: 'Summary' },
    { accessorKey: 'data_classes', header: 'Data classes' },
    { accessorKey: 'people_affected', header: 'People affected' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/admin/privacy/incidents' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Incidents"
        subject="incidents"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
