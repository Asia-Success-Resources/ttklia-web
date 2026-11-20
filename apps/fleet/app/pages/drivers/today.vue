<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Drivers today: who is free, off, on van duty, at GHR (table `driver_day_status`). Permission: fleet.drivers_today.read (doc 27).
// GET /api/v1/ops/w/{workspace}/fleet/drivers/today (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Drivers today' })

interface Row extends Record<string, unknown> {
    uuid: string
    service_date: string
    status: string
    note: string | null
    set_by: number
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'service_date', header: 'Service date' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'note', header: 'Note' },
    { accessorKey: 'set_by', header: 'Set by' },
    { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/fleet/drivers/today', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Drivers today"
        subject="drivers today"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
