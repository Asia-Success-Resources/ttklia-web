<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Displays: boards, bus hub, layouts (table `display_screens`). Permission: bus.displays.read (doc 27).
// GET /api/ops/w/{workspace}/displays (ttklia-api).
useHead({ title: 'Displays' })

interface Row extends Record<string, unknown> {
    uuid: string
    code: string
    layout: string
    platforms: unknown | null
    languages: string
    plays_audio: boolean
    ad_slot: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'layout', header: 'Layout' },
    { accessorKey: 'platforms', header: 'Platforms' },
    { accessorKey: 'languages', header: 'Languages' },
    { accessorKey: 'plays_audio', header: 'Plays audio' },
    { accessorKey: 'ad_slot', header: 'Ad slot' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/displays', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Displays"
        subject="displays"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
