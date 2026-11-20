<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Templates: list (table `message_templates`). Permission: ride.messaging_templates.read (doc 27).
// GET /api/v1/ops/w/{workspace}/messaging/templates (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Templates' })

interface Row extends Record<string, unknown> {
    uuid: string
    key: string
    channel: string
    locale: string
    provider_name: string | null
    category: string
    body: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'key', header: 'Key' },
    { accessorKey: 'channel', header: 'Channel' },
    { accessorKey: 'locale', header: 'Locale' },
    { accessorKey: 'provider_name', header: 'Provider name' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'body', header: 'Body' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/messaging/templates', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Templates"
        subject="templates"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
