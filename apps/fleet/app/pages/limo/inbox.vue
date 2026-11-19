<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Inbox: WhatsApp requests to turn into bookings (table `inbound_messages`). Permission: fleet.limo_inbox.read (doc 27).
// TODO(pending: P7) see doc 30.
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  channel: string
  provider_reference: string
  kind: string
  quoted_provider_reference: string | null
  group_ref: string | null
  from_address: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'channel', header: 'Channel' },
  { accessorKey: 'provider_reference', header: 'Provider reference' },
  { accessorKey: 'kind', header: 'Kind' },
  { accessorKey: 'quoted_provider_reference', header: 'Quoted provider reference' },
  { accessorKey: 'group_ref', header: 'Group ref' },
  { accessorKey: 'from_address', header: 'From address' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Inbox"
    subject="inbox"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    note="Waiting on: P7 (doc 30)."
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
