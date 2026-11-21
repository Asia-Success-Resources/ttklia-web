<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Manual entries: manual bus entries (table `gate_overrides`). Permission: bus.manual_entries.read (doc 27).
// GET /api/ops/w/{workspace}/gate-overrides (ttklia-api).
useHead({ title: 'Manual entries' })

interface Row extends Record<string, unknown> {
    uuid: string
    reason: string
    opened_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'reason', header: 'Reason' },
    { accessorKey: 'opened_at', header: 'Opened at' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/gate-overrides', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Manual entries"
        subject="manual entries"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
