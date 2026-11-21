<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Campaigns: blasts and reports (table `message_campaigns`). Permission: ride.messaging_campaigns.read (doc 27).
// TODO(api): reads GET /ops/messaging/campaigns (doc 04) by hand until packages/api-client-ts is generated.
useHead({ title: 'Campaigns' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    channel: string
    purpose: string
    audience: unknown
    scheduled_at: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'channel', header: 'Channel' },
    { accessorKey: 'purpose', header: 'Purpose' },
    { accessorKey: 'audience', header: 'Audience' },
    { accessorKey: 'scheduled_at', header: 'Scheduled at' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: "/ops/messaging/campaigns", workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Campaigns"
        subject="campaigns"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
