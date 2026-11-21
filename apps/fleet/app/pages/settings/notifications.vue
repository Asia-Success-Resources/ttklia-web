<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Notifications: WhatsApp rules, templates (table `notification_rules`). Permission: fleet.settings_notifications.read (doc 27).
// TODO(pending: C2) see doc 30.
// GET /api/ops/w/{workspace}/settings/notifications (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Notifications' })

interface Row extends Record<string, unknown> {
    uuid: string
    event: string
    status_filter: unknown | null
    audience: string
    reply_in_thread: boolean
    enabled: boolean
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'event', header: 'Event' },
    { accessorKey: 'status_filter', header: 'Status filter' },
    { accessorKey: 'audience', header: 'Audience' },
    { accessorKey: 'reply_in_thread', header: 'Reply in thread' },
    { accessorKey: 'enabled', header: 'Enabled' },
    { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/settings/notifications', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Notifications"
        subject="notifications"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        note="Waiting on: C2 (doc 30)."
        @page="list.load"
    />
</template>
