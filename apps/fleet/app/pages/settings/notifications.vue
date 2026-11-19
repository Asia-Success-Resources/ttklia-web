<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Notifications: WhatsApp rules, templates (table `notification_rules`). Permission: fleet.settings_notifications.read (doc 27).
// TODO(pending: C2) see doc 30.
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

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
const list = useApiList<Row>({ path: null, workspaceScoped: true })
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
    :has-more="list.nextCursor.value !== null"
    note="Waiting on: C2 (doc 30)."
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
