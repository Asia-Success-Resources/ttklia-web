<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Inbox: WhatsApp requests to turn into bookings (table `inbound_messages`). Permission: fleet.limo_inbox.read (doc 27).
// TODO(pending: P7) see doc 30.
// GET /api/v1/ops/w/{workspace}/fleet/inbox (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Inbox' })

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
const list = useApiList<Row>({ path: '/fleet/inbox', workspaceScoped: true })
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
