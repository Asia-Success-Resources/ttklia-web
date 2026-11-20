<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Ads: kiosk ads, schedule, plays (table `kiosk_ads`). Permission: global.settings_ads.read (doc 27).
// GET /api/v1/admin/settings/ads (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Ads' })

interface Row extends Record<string, unknown> {
    uuid: string
    title: string
    media_type: string
    media_sha256: string
    duration_s: number
    priority: number
    location_ids: unknown | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'media_type', header: 'Media type' },
    { accessorKey: 'media_sha256', header: 'Media sha256' },
    { accessorKey: 'duration_s', header: 'Duration s' },
    { accessorKey: 'priority', header: 'Priority' },
    { accessorKey: 'location_ids', header: 'Location ids' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/admin/settings/ads' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Ads"
        subject="ads"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
