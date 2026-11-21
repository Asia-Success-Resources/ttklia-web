<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Dispatch: rounds, windows (table `ride_offers`). Permission: ride.dispatch.read (doc 27).
// GET /api/ops/w/{workspace}/ride/dispatch (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Dispatch' })

interface Row extends Record<string, unknown> {
    uuid: string
    round: number
    ring_k: number
    eta_seconds: number
    offered_at: string
    expires_at: string
    response: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'round', header: 'Round' },
    { accessorKey: 'ring_k', header: 'Ring k' },
    { accessorKey: 'eta_seconds', header: 'Eta seconds' },
    { accessorKey: 'offered_at', header: 'Offered at' },
    { accessorKey: 'expires_at', header: 'Expires at' },
    { accessorKey: 'response', header: 'Response' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/ride/dispatch', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Dispatch"
        subject="dispatch"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
