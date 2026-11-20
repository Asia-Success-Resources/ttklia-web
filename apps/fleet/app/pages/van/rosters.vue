<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Rosters: standing plan (agent list) (table `van_route_rosters`). Permission: fleet.van_rosters.read (doc 27).
// GET /api/v1/ops/w/{workspace}/fleet/van-rosters (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Rosters' })

interface Row extends Record<string, unknown> {
    uuid: string
    pickup_time: string
    return_time: string
    days: string
    valid_from: string
    valid_to: string | null
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'pickup_time', header: 'Pickup time' },
    { accessorKey: 'return_time', header: 'Return time' },
    { accessorKey: 'days', header: 'Days' },
    { accessorKey: 'valid_from', header: 'Valid from' },
    { accessorKey: 'valid_to', header: 'Valid to' },
    { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/fleet/van-rosters', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Rosters"
        subject="rosters"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
