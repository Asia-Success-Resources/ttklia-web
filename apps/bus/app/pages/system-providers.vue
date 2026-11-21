<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// System providers: operator API clients (table `system_providers`). Permission: bus.system_providers.read (doc 27).
// GET /api/ops/w/{workspace}/system-providers (ttklia-api).
useHead({ title: 'System providers' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    kind: string
    adapter: string
    base_url: string | null
    auth: string
    soap_action_prefix: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'kind', header: 'Kind' },
    { accessorKey: 'adapter', header: 'Adapter' },
    { accessorKey: 'base_url', header: 'Base url' },
    { accessorKey: 'auth', header: 'Auth' },
    { accessorKey: 'soap_action_prefix', header: 'Soap action prefix' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/system-providers', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="System providers"
        subject="system providers"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
