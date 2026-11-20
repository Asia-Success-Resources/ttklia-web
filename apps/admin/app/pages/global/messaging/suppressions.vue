<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Suppressions: list (table `suppressions`). Permission: global.messaging_suppressions.read (doc 27).
// GET /api/v1/admin/messaging/suppressions (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Suppressions' })

interface Row extends Record<string, unknown> {
    uuid: string
    channel: string
    reason: string
    expires_at: string | null
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'channel', header: 'Channel' },
    { accessorKey: 'reason', header: 'Reason' },
    { accessorKey: 'expires_at', header: 'Expires at' },
    { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/admin/messaging/suppressions' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Suppressions"
        subject="suppressions"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
