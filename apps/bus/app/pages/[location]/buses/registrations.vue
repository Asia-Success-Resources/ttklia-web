<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Registrations: approval requests (no table). Permission: bus.buses_registrations.read (doc 27).
// TODO(pending: doc 09 gap) no table for this screen yet in tools/schema.py (sitemap "*").
// GET /api/v1/ops/w/{workspace}/vehicles/registrations (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Registrations' })

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
const list = useApiList<Row>({ path: '/vehicles/registrations', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Registrations"
        subject="registrations"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        note="No table for this screen yet in the data model (doc 09, gap list)."
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
