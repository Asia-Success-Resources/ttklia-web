<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Platforms: who holds each platform (table `platform_occupancies`). Permission: bus.platforms.read (doc 27).
// GET /api/ops/w/{workspace}/platforms (ttklia-api).
useHead({ title: 'Platforms' })

interface Row extends Record<string, unknown> {
    uuid: string
    from_at: string
    until_at: string | null
    released_at: string | null
    source: string
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'from_at', header: 'From at' },
    { accessorKey: 'until_at', header: 'Until at' },
    { accessorKey: 'released_at', header: 'Released at' },
    { accessorKey: 'source', header: 'Source' },
    { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/platforms', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Platforms"
        subject="platforms"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
