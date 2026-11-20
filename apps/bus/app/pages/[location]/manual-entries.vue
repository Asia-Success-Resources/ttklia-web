<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Manual entries: manual bus entries (table `gate_overrides`). Permission: bus.manual_entries.read (doc 27).
// GET /api/v1/ops/w/{workspace}/gate-overrides (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
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
const list = useApiList<Row>({ path: '/gate-overrides', workspaceScoped: true })
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
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
