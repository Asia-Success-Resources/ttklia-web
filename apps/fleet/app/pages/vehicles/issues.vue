<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Issues: defects (table `vehicle_issues`). Permission: fleet.vehicles_issues.read (doc 27).
// GET /api/v1/ops/w/{workspace}/fleet/vehicle-issues (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Issues' })

interface Row extends Record<string, unknown> {
    uuid: string
    reported_at: string
    reported_by: number | null
    description: string
    blocks_use: boolean
    status: string
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'reported_at', header: 'Reported at' },
    { accessorKey: 'reported_by', header: 'Reported by' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'blocks_use', header: 'Blocks use' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/fleet/vehicle-issues', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Issues"
        subject="issues"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
