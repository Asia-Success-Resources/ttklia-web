<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Kiosks: list (table `devices`). Permission: taxi.kiosks.read (doc 27).
// GET /api/v1/ops/w/{workspace}/devices (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Kiosks' })

interface Row extends Record<string, unknown> {
    uuid: string
    type: string
    name: string
    status: string
    software_version: string | null
    os: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'software_version', header: 'Software version' },
    { accessorKey: 'os', header: 'Os' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/devices', workspaceScoped: true, query: { type: 'kiosk_agent' } })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Kiosks"
        subject="kiosks"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
