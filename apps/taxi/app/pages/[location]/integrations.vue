<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Integrations: list (no table). Permission: taxi.integrations.read (doc 27).
// GET /api/v1/ops/w/{workspace}/integrations (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Integrations' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    status: string
    updated_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'updated_at', header: 'Updated at' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/integrations', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Integrations"
        subject="integrations"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
