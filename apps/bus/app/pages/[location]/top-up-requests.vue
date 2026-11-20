<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Top up requests: operator credit (no table). Permission: bus.top_up_requests.read (doc 27).
// TODO(pending: doc 09 gap) no table for this screen yet in tools/schema.py (sitemap "*").
// GET /api/v1/ops/w/{workspace}/top-up-requests (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Top-up requests' })

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
const list = useApiList<Row>({ path: '/top-up-requests', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Top up requests"
        subject="top up requests"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        note="No table for this screen yet in the data model (doc 09, gap list)."
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
